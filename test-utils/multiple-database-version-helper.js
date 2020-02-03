const {
  DATABASE_URL_MONGODB_MIN,
  DATABASE_URL_MONGODB_MAX,
  DATABASE_URL_MSSQL_MAX,
  DATABASE_URL_MSSQL_MIN,
  DATABASE_URL_MYSQL_MAX,
  DATABASE_URL_MYSQL_MIN,
  DATABASE_URL_POSTGRESQL_MAX,
  DATABASE_URL_POSTGRESQL_MIN,
} = require('./database-urls');

const mongoDatabases = [{
  version: '3.2',
  url: DATABASE_URL_MONGODB_MIN,
}, {
  version: '4.2',
  url: DATABASE_URL_MONGODB_MAX,
}];

const sqlDatabases = [{
  dialect: 'mysql',
  version: '5.6',
  connectionUrl: DATABASE_URL_MYSQL_MIN,
  schema: 'public',
}, {
  dialect: 'mysql',
  version: '8.0',
  connectionUrl: DATABASE_URL_MYSQL_MAX,
  schema: 'public',
}, {
  dialect: 'postgres',
  version: '9.4',
  connectionUrl: DATABASE_URL_POSTGRESQL_MIN,
  schema: 'public',
}, {
  dialect: 'postgres',
  version: '12.1',
  connectionUrl: DATABASE_URL_POSTGRESQL_MAX,
  schema: 'public',
}, {
  dialect: 'mssql',
  version: '2017-CU8-ubuntu',
  connectionUrl: DATABASE_URL_MSSQL_MIN,
  schema: 'dbo',
}, {
  dialect: 'mssql',
  version: '2019-GDR1-ubuntu-16.04',
  connectionUrl: DATABASE_URL_MSSQL_MAX,
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
      describe(`using ${sqlDatabase.dialect} Database v${sqlDatabase.version}`, tests(sqlDatabase));
    });
  },
};
