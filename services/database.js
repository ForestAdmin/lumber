const Sequelize = require('sequelize');
const { MongoClient } = require('mongodb');
const { terminate } = require('../utils/terminator');

function Database() {
  async function handleAuthenticationError(error) {
    return terminate(1, {
      logs: [
        'Cannot connect to the database due to the following error:',
        error,
      ],
      errorCode: 'database_authentication_error',
      errorMessage: error.message,
    });
  }

  function sequelizeAuthenticate(connection) {
    return connection.authenticate()
      .then(() => connection)
      .catch((error) => handleAuthenticationError(error));
  }

  function getDialect(dbConnectionUrl, dbDialect) {
    if (dbConnectionUrl) {
      if (dbConnectionUrl.startsWith('postgres://')) { return 'postgres'; }
      if (dbConnectionUrl.startsWith('mysql://')) { return 'mysql'; }
      if (dbConnectionUrl.startsWith('mssql://')) { return 'mssql'; }
      // NOTICE: For MongoDB can be "mongodb://" or "mongodb+srv://"
      if (dbConnectionUrl.startsWith('mongodb')) { return 'mongodb'; }
    }
    return dbDialect;
  }

  function connectToMongodb(options, isSSL) {
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
      .then((client) => client.db(options.dbName))
      .catch((error) => handleAuthenticationError(error));
  }

  this.connect = (options) => {
    const isSSL = options.dbSSL || options.ssl;
    const databaseDialect = getDialect(options.dbConnectionUrl, options.dbDialect);

    if (databaseDialect === 'mongodb') {
      return connectToMongodb(options, isSSL);
    }

    const connectionOptionsSequelize = { logging: false };

    if (databaseDialect === 'mssql') {
      connectionOptionsSequelize.dialectOptions = { options: { encrypt: isSSL } };
    } else if (isSSL) {
      // Add SSL options only if the user selected SSL mode.
      // SSL Cerificate is always trusted during `lumber generate` command to ease their onboarding.
      connectionOptionsSequelize.dialectOptions = { ssl: { rejectUnauthorized: false } };
    }

    let connection;
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
