'use strict';

exports.getDatabaseUrl = function getDatabaseUrl (config) {
  if (config.dbConnectionUrl) { return config.dbConnectionUrl; }

  let connectionString;

  if (config.dbDialect === 'sqlite') {
    connectionString = `sqlite://${config.dbStorage}`;
  } else {
    connectionString = `${config.dbDialect}://${config.dbUser}`;
    if (config.dbPassword) {
      // NOTICE: Encode password string in case of special chars.
      connectionString += `:${encodeURIComponent(config.dbPassword)}`;
    }
    connectionString += `@${config.dbHostname}:${config.dbPort}/${config.dbName}`;
  }

  return connectionString;
}
