const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

if (!process.env.DATABASE_URL) {
  console.error('Cannot connect to the database. Please declare the DATABASE_URL environment variable with the correct database connection string.');
  process.exit();
}

const databaseOptions = {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
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

const sequelize = new Sequelize(process.env.DATABASE_URL, databaseOptions);
const db = {};

fs
  .readdirSync(__dirname)
  .filter((file) => {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach((file) => {
    try {
      const model = sequelize.import(path.join(__dirname, file));
      db[model.name] = model;
    } catch (error) {
      console.error('Model creation error: ' + error);
    }
  });

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
