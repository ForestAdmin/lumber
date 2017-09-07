'use strict';
const Sequelize = require('sequelize');
const logger = require('./logger');

function Database() {
  this.connect = function (options) {
    let db;

    if (options.dbDialect === 'sqlite') {
      db = new Sequelize('sqlite://' + options.dbStorage);
    } else {
      const isSSL = options.dbSSL || options.ssl;
      const needsEncryption = isSSL && (options.dbDialect === 'mssql');

      let connectionOpts = {
        logging: false,
        dialectOptions: {
          ssl: isSSL,
          encrypt: needsEncryption
        }
      };

      if (options.dbConnectionUrl) {
        db = new Sequelize(options.dbConnectionUrl, connectionOpts);
      } else {
        connectionOpts.host = options.dbHostname;
        connectionOpts.port = options.dbPort;
        connectionOpts.dialect = options.dbDialect;

        db = new Sequelize(options.dbName, options.dbUser,
          options.dbPassword, connectionOpts);
      }
    }

    return db.authenticate()
      .then(() => db)
      .catch((error) => {
        logger.error('💀  Ouch, cannot connect to the database 💀  due to ' +
          'the following error:\n', error);
        process.exit(1);
      });
  };
}

module.exports = Database;
