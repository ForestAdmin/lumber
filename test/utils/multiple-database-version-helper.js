const mongoDatabases = [
  { version: '3.2', url: 'mongodb://localhost:27015' },
  { version: '4.2', url: 'mongodb://localhost:27016' },
];

module.exports = {
  describeMongoDatabases(tests) {
    mongoDatabases.forEach((mongoDatabase) => {
      describe(`Using Mongo Database v${mongoDatabase.version}`, tests(mongoDatabase.url));
    });
  },
};
