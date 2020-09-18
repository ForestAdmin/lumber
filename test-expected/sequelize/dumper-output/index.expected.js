const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

function getDialectOptions() {
  try {
    if (!process.env.DATABASE_DIALECT_OPTIONS) return {};
    const dialectOptions = JSON.parse(process.env.DATABASE_DIALECT_OPTIONS);
    if (dialectOptions === null || typeof dialectOptions !== 'object') throw new Error();
    return dialectOptions;
  } catch (e) {
    console.error('DATABASE_DIALECT_OPTIONS is not a valid JSON object, please check your `.env` file.');
    process.exit();
  }
}

if (!process.env.DATABASE_URL) {
  console.error('Cannot connect to the database. Please declare the DATABASE_URL environment variable with the correct database connection string.');
  process.exit();
}

const databaseOptions = {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { maxConnections: 10, minConnections: 1 },
  dialectOptions: getDialectOptions(),
};

if (process.env.DATABASE_SSL && JSON.parse(process.env.DATABASE_SSL.toLowerCase())) {
  if (!databaseOptions.dialectOptions.ssl) {
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
