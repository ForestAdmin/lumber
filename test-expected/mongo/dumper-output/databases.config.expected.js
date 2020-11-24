const databaseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

module.exports = [{
  name: 'default',
  modelsDir: '.',
  connection: {
    url: process.env.DATABASE_URL,
    options: { ...databaseOptions },
  },
}];