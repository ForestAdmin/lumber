const Sequelize = require('sequelize');
const { MongoClient } = require('mongodb');
const logger = require('./logger');

function Database() {
  function error(err) {
    logger.error('💀  Ouch, cannot connect to the database 💀  due to ' +
    'the following error:\n', err);

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
    } else if (options.dbDialect === 'mongodb') {
      let connectionUrl = 'mongodb://';
      if (options.dbUser) { connectionUrl += options.dbUser; }
      if (options.dbPassword) { connectionUrl += `:${options.dbPassword}`; }
      connectionUrl += `@${options.dbHostname}:${options.dbPort}/${options.dbName}`;

      const opts = { useNewUrlParser: true };
      if (isSSL) {
        opts.server = { ssl: true };
      }

      MongoClient.connect(connectionUrl, opts, (err, client) => {
        if (err !== null) { return error(err); }

        db = client;
        return db;
      });
    } else {
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
    }

    return db;
  };
}

module.exports = Database;
