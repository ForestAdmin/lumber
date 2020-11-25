const databaseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

module.exports = [{
  name: 'default',
  modelsDir: './models',
  connection: {
    url: process.env.DATABASE_URL,
    options: { ...databaseOptions },
  },
}];
