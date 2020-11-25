const path = require('path');

const databaseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

module.exports = [{
  name: 'default',
  modelsDir: path.resolve(__dirname, '../models'),
  connection: {
    url: process.env.DATABASE_URL,
    options: { ...databaseOptions },
  },
}];
