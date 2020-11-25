const path = require('path');

const databaseOptions = {
  logging: !process.env.NODE_ENV || process.env.NODE_ENV === 'development' ? console.log : false,
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

module.exports = [{
  name: 'default',
  modelsDir: path.resolve(__dirname, '../models'),
  connection: {
    url: process.env.DATABASE_URL,
    options: { ...databaseOptions },
  },
}];
