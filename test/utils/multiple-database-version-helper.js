const {
  DATABASE_URL_MONGODB_3_2,
  DATABASE_URL_MONGODB_4_2,
  DATABASE_URL_MSSQL,
  DATABASE_URL_MYSQL,
  DATABASE_URL_POSTGRESQL,
} = require('./database-urls');

const mongoDatabases = [{
  version: '3.2',
  url: DATABASE_URL_MONGODB_3_2,
}, {
  version: '4.2',
  url: DATABASE_URL_MONGODB_4_2,
}];

const sqlDatabases = [{
  dialect: 'mysql',
  connectionUrl: DATABASE_URL_MYSQL,
  schema: 'public',
}, {
  dialect: 'postgres',
  connectionUrl: DATABASE_URL_POSTGRESQL,
  schema: 'public',
}, {
  dialect: 'mssql',
  connectionUrl: DATABASE_URL_MSSQL,
  schema: 'dbo',
}];

module.exports = {
  describeMongoDatabases(tests) {
    mongoDatabases.forEach((mongoDatabase) => {
      // eslint-disable-next-line jest/valid-describe
      describe(`using Mongo Database v${mongoDatabase.version}`, tests(mongoDatabase.url));
    });
  },
  describeSequelizeDatabases(tests) {
    sqlDatabases.forEach((sqlDatabase) => {
      // eslint-disable-next-line jest/valid-describe
      describe(`using ${sqlDatabase.dialect} Database`, tests(sqlDatabase));
    });
  },
};
