const mongoDatabases = [
  { version: '3.2', url: 'mongodb://localhost:27015' },
  { version: '4.2', url: 'mongodb://localhost:27016' },
];

const sqlDatabases = [
  {
    dialect: 'mysql',
    connectionUrl: 'mysql://forest:secret@localhost:8999/lumber-sequelize-test',
    schema: 'public',
  },
  {
    dialect: 'postgres',
    connectionUrl: 'postgres://forest:secret@localhost:54369/lumber-sequelize-test',
    schema: 'public',

  },
  {
    dialect: 'mssql',
    connectionUrl: 'mssql://sa:forest2019:@localhost:1432/model',
    schema: 'dbo',

  },
];

module.exports = {
  describeMongoDatabases(tests) {
    mongoDatabases.forEach((mongoDatabase) => {
      describe(`Using Mongo Database v${mongoDatabase.version}`, tests(mongoDatabase.url));
    });
  },
  describeSQLDatabases(tests) {
    sqlDatabases.forEach((sqlDatabase) => {
      describe(`Using ${sqlDatabase.dialect} Database`, tests(sqlDatabase));
    });
  },
};
