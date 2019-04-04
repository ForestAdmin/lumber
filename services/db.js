const Sequelize = require('sequelize');
const { MongoClient } = require('mongodb');
const logger = require('./logger');

function Database() {
  function error(err) {
    logger.error(
      'Cannot connect to the database due to the following error:',
      err,
    );

    process.exit(1);
  }

  function sequelizeAuthenticate(db) {
    return db.authenticate()
      .then(() => db)
      .catch(err => error(err));
  }

  this.connect = (options) => {
    const isSSL = options.dbSSL || options.ssl;
    let db;

    if (options.dbDialect === 'sqlite') {
      db = new Sequelize(`sqlite://${options.dbStorage}`, {
        logging: false,
      });

      return sequelizeAuthenticate(db);
    } else if (options.dbDialect === 'mongodb' || (options.dbConnectionUrl && options.dbConnectionUrl.startsWith('mongodb://'))) {
      const opts = { useNewUrlParser: true };
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
        if (isSSL) { opts.ssl = true; }
      }

      return MongoClient.connect(connectionUrl, opts)
        .then(client => client.db(options.dbName));
    }

    const needsEncryption = isSSL && (options.dbDialect === 'mssql');

    const connectionOpts = {
      logging: false,
      dialectOptions: {
        ssl: isSSL,
        encrypt: needsEncryption,
      },
    };

    if (options.dbConnectionUrl) {
      db = new Sequelize(options.dbConnectionUrl, connectionOpts);
    } else {
      connectionOpts.host = options.dbHostname;
      connectionOpts.port = options.dbPort;
      connectionOpts.dialect = options.dbDialect;

      db = new Sequelize(
        options.dbName, options.dbUser,
        options.dbPassword, connectionOpts,
      );
    }

    return sequelizeAuthenticate(db);
  };
}

module.exports = Database;
