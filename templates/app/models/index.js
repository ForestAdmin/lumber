<% if (config.dbDialect === 'mongodb') {
%>const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
module.exports = mongoose.models;
<% } else {
%>const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

if (!process.env.DATABASE_URL) {
  console.error('Cannot connect to the database. Please declare the DATABASE_URL environment variable with the correct database connection string.');
  process.exit();
}

let databaseOptions = {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { maxConnections: 10, minConnections: 1 },
  dialectOptions: {}
};

if (process.env.DATABASE_SSL && JSON.parse(process.env.DATABASE_SSL.toLowerCase())) {
<% if (config.dbDialect === 'mysql') {
%>  databaseOptions.dialectOptions.ssl = { rejectUnauthorized: true };
<% } else {
%>  databaseOptions.dialectOptions.ssl = true;
<% } 
%>}

if (process.env.DATABASE_ENCRYPT && JSON.parse(process.env.DATABASE_ENCRYPT.toLowerCase())) {
  databaseOptions.dialectOptions.encrypt = true;
}

let sequelize = new Sequelize(process.env.DATABASE_URL, databaseOptions);
let db = {};

fs
  .readdirSync(__dirname)
  .filter(function (file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function (file) {
    try {
      var model = sequelize['import'](path.join(__dirname, file));
      db[model.name] = model;
    } catch (error) {
      console.error('Model creation error: ' + error);
    }
  });

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
<% } %>
