'use strict';
var Sequelize = require('sequelize');

function Database() {
  this.connect = function (options) {
    return new Sequelize(options.database, options.user, options.password, {
      dialect: options.dialect,
      hostname: options.hostname,
      port: options.port,
      logging: false
    });
  };
}

module.exports = Database;
