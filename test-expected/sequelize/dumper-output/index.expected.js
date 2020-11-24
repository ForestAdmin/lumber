const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const databasesConfiguration = require('../databases.config');

const connections = {};
const db = {};

databasesConfiguration.forEach((databaseInfo) => {
  const connection = new Sequelize(databaseInfo.connection.url, databaseInfo.connection.options);
  connections[databaseInfo.name] = connection;

  const modelsDir = databaseInfo.modelsDir || databaseInfo.name;
  fs
    .readdirSync(path.join(__dirname, modelsDir))
    .filter((file) => file.indexOf('.') !== 0 && file !== 'index.js')
    .forEach((file) => {
      try {
        const model = connection.import(path.join(__dirname, modelsDir, file));
        db[model.name] = model;
      } catch (error) {
        console.error(`Model creation error: ${error}`);
      }
    });
});

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.objectMapping = Sequelize;
db.connections = connections;

module.exports = db;
