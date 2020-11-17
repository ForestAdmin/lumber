const fs = require('fs');
const path = require('path');
const Mongoose = require('mongoose');

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
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  const connection = Mongoose.createConnection(databaseInfo.connection.url, databaseOptions);
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
        console.error('Model creation error: ' + error);
      }
    });
});

db.objectMapping = Mongoose;
db.connections = connections;

module.exports = db;