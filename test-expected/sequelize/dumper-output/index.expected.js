const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const databasesConfiguration = [{
  name: 'default',
  modelsDir: '.',
  connection: {
    url: process.env.DATABASE_URL
  }
}];

const connections = {};
const db = {};

databasesConfiguration.forEach((databaseInfo) => {
  const databaseOptions = {
    logging: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? console.log : false,
    pool: { maxConnections: 10, minConnections: 1 },
    dialectOptions: {},
  };
  if (process.env.DATABASE_SSL && JSON.parse(process.env.DATABASE_SSL.toLowerCase())) {
    const rejectUnauthorized = process.env.DATABASE_REJECT_UNAUTHORIZED;
    if (rejectUnauthorized && (JSON.parse(rejectUnauthorized.toLowerCase()) === false)) {
      databaseOptions.dialectOptions.ssl = { rejectUnauthorized: false };
    } else {
      databaseOptions.dialectOptions.ssl = true;
    }
  }

  const connection = new Sequelize(databaseInfo.connection.url, databaseOptions);
  connections[databaseInfo.name] = connection;

  const modelsDir = databaseInfo.modelsDir || databaseInfo.name;
  fs
    .readdirSync(path.join(__dirname, modelsDir))
    .filter((file) => file.indexOf('.') !== 0 && file !== 'index.js')
    .forEach((file) => {
      try {
        const model = connection.import(path.join(__dirname, file));
        db[model.name] = model;
      } catch (error) {
        console.error('Model creation error: ' + error);
      }
    });
});

db.objectMapping = Sequelize;
db.connections = connections;

module.exports = db;