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
    const hasDialectOptions = Boolean(options.dialectOptions);

    let connection;
    const databaseDialect = getDialect(options.dbConnectionUrl, options.dbDialect);

    if (databaseDialect === 'mongodb') {
      return connectToMongodb(options, isSSL);
    }

    const connectionOptionsSequelize = { logging: false };

    connectionOptionsSequelize.dialectOptions = hasDialectOptions ? options.dialectOptions : {};

    // NOTICE: mysql2 does not accepts unwanted options anymore.
    //         See: https://github.com/sidorares/node-mysql2/pull/895
    if (databaseDialect === 'mysql') {
      // NOTICE: Add SSL options only if the user selected SSL mode.
      if (isSSL) {
        // TODO: Lumber should accept certificate file (CRT) to work with SSL.
        //       Since it requires to review onboarding, it is not implemented yet.
        //       See: https://www.npmjs.com/package/mysql#ssl-options
        connectionOptionsSequelize.dialectOptions.ssl = { rejectUnauthorized: isSSL };
      }
    } else if (databaseDialect === 'mssql') {
      connectionOptionsSequelize.dialectOptions.options = { encrypt: isSSL };
    } else {
      connectionOptionsSequelize.dialectOptions.ssl = isSSL;
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
