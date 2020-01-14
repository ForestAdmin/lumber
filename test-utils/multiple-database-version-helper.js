const {
  DATABASE_URL_MONGODB_3_2,
  DATABASE_URL_MONGODB_4_2,
  DATABASE_URL_MSSQL,
  DATABASE_URL_MSSQL_OLD,
  DATABASE_URL_MYSQL,
  DATABASE_URL_MYSQL_OLD,
  DATABASE_URL_POSTGRESQL,
  DATABASE_URL_POSTGRESQL_OLD,
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
  version: '5.6',
  connectionUrl: DATABASE_URL_MYSQL_OLD,
  schema: 'public',
}, {
  dialect: 'mysql',
  version: '5.7',
  connectionUrl: DATABASE_URL_MYSQL,
  schema: 'public',
}, {
  dialect: 'postgres',
  version: '9.4',
  connectionUrl: DATABASE_URL_POSTGRESQL_OLD,
  schema: 'public',
}, {
  dialect: 'postgres',
  version: '12.1',
  connectionUrl: DATABASE_URL_POSTGRESQL,
  schema: 'public',
}, {
  dialect: 'mssql',
  version: '2017-CU8-ubuntu',
  connectionUrl: DATABASE_URL_MSSQL_OLD,
  schema: 'dbo',
}, {
  dialect: 'mssql',
  version: '2019-GDR1-ubuntu-16.04',
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
      describe(`using ${sqlDatabase.dialect} Database v${sqlDatabase.version}`, tests(sqlDatabase));
    });
  },
};
