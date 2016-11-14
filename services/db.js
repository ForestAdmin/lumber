'use strict';
const Sequelize = require('sequelize');
const logger = require('./logger');

function Database() {
  this.connect = function (options) {
    let db = new Sequelize(options.dbName, options.dbUser,
      options.dbPassword, {
        dialect: options.dbDialect,
        host: options.dbHostname,
        port: options.dbPort,
        logging: false,
        dialectOptions: {
          ssl: options.ssl
        }
      });

    return db.authenticate()
      .then(() => db)
      .catch(() => {
        logger.error('💀  Ouch, cannot connect to the database 💀');
        process.exit(1);
      });

  };
}

module.exports = Database;
