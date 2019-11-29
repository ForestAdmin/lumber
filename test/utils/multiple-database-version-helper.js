const mongoDatabases = [
  { version: '3.2', url: 'mongodb://localhost:27015' },
  { version: '4.2', url: 'mongodb://localhost:27016' },
];
const sqlDatabases = [{
  dialect: 'mysql',
  url: 'mysql://forest:secret@localhost:8999/lumber-sequelize-test',
}, {
  dialect: 'postgres',
  url: 'postgres://forest:secret@localhost:54369/lumber-sequelize-test',
}, {
  dialect: 'mssql',
  url: 'mssql://sa:forest2019:@localhost:1432/model',
}];

module.exports = {
  describeMongoDatabases(tests) {
    mongoDatabases.forEach((mongoDatabase) => {
      describe(`Using Mongo Database v${mongoDatabase.version}`, tests(mongoDatabase.url));
    });
  },
  describeSqlDatabases(tests) {
    sqlDatabases.forEach((sqlDatabase) => {
      describe(`Using Database ${sqlDatabase.dialect}`, tests(sqlDatabase.url, sqlDatabase.dialect));
    });
  },
};
