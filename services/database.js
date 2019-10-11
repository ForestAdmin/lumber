const Sequelize = require('sequelize');
const { MongoClient } = require('mongodb');
const logger = require('./logger');
const eventSender = require('./event-sender');

function Database() {
  async function handleAuthenticationError(error) {
    logger.error('Cannot connect to the database due to the following error:', error);
    await eventSender.notifyError('database_authentication_error', error.message);
    process.exit(1);
  }

  function sequelizeAuthenticate(connection) {
    return connection.authenticate()
      .then(() => connection)
      .catch(error => handleAuthenticationError(error));
  }

  this.connect = (options) => {
    const isSSL = options.dbSSL || options.ssl;
    let connection;
    let databaseDialect;

    if (options.dbConnectionUrl) {
      if (options.dbConnectionUrl.startsWith('postgres://')) {
        databaseDialect = 'postgres';
      } else if (options.dbConnectionUrl.startsWith('mysql://')) {
        databaseDialect = 'mysql';
      } else if (options.dbConnectionUrl.startsWith('mssql://')) {
        databaseDialect = 'mssql';
      // NOTICE: For MongoDB can be "mongodb://" or "mongodb+srv://"
      } else if (options.dbConnectionUrl.startsWith('mongodb')) {
        databaseDialect = 'mongodb';
      }
    } else {
      databaseDialect = options.dbDialect;
    }

    if (databaseDialect === 'mongodb') {
      const connectionOptionsMongoClient = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
      let connectionUrl = options.dbConnectionUrl;

      if (!connectionUrl) {
        connectionUrl = 'mongodb';
        if (options.mongodbSrv) { connectionUrl += '+srv'; }
        connectionUrl += '://';
        if (options.dbUser) { connectionUrl += options.dbUser; }
        if (options.dbPassword) { connectionUrl += `:${options.dbPassword}`; }
        connectionUrl += `@${options.dbHostname}`;
        if (!options.mongodbSrv) { connectionUrl += `:${options.dbPort}`; }
        connectionUrl += `/${options.dbName}`;
        if (isSSL) { connectionOptionsMongoClient.ssl = true; }
      }

      return MongoClient.connect(connectionUrl, connectionOptionsMongoClient)
        .then(client => client.db(options.dbName));
    }

    const needsEncryption = isSSL && (databaseDialect === 'mssql');

    const connectionOptionsSequelize = { logging: false };

    // NOTICE: mysql2 does not accepts unwanted options anymore.
    //         See: https://github.com/sidorares/node-mysql2/pull/895
    if (databaseDialect === 'mysql') {
      connectionOptionsSequelize.dialectOptions = {
        ssl: { rejectUnauthorized: isSSL },
      };
    } else {
      connectionOptionsSequelize.dialectOptions = {
        ssl: isSSL,
        encrypt: needsEncryption,
      };
    }

    if (options.dbConnectionUrl) {
      connection = new Sequelize(options.dbConnectionUrl, connectionOptionsSequelize);
    } else {
      connectionOptionsSequelize.host = options.dbHostname;
      connectionOptionsSequelize.port = options.dbPort;
      connectionOptionsSequelize.dialect = databaseDialect;

      connection = new Sequelize(
        options.dbName, options.dbUser,
        options.dbPassword, connectionOptionsSequelize,
      );
    }

    return sequelizeAuthenticate(connection);
  };
}

module.exports = Database;
