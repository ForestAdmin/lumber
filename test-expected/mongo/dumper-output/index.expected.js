const fs = require('fs');
const path = require('path');
const Mongoose = require('mongoose');

const databasesConfiguration = require('../databases.config');

const connections = {};
const db = {};

databasesConfiguration.forEach((databaseInfo) => {
  const connection = Mongoose.createConnection(databaseInfo.connection.url, databaseInfo.connection.options);
  connections[databaseInfo.name] = connection;

  const modelsDir = databaseInfo.modelsDir || databaseInfo.name;
  fs
    .readdirSync(path.join(__dirname, modelsDir))
    .filter((file) => file.indexOf('.') !== 0 && file !== 'index.js')
    .forEach((file) => {
      try {
        const model = require(path.join(__dirname, modelsDir, file))(connection, Mongoose);
        db[model.name] = model;
      } catch (error) {
        console.error(`Model creation error: ${error}`);
      }
    });
});

db.objectMapping = Mongoose;
db.connections = connections;

module.exports = db;
