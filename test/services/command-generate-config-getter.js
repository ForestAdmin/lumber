/* global describe, it */
const { expect } = require('chai');
const CommandGenerateConfigGetter = require('../../services/command-generate-config-getter');

describe('Services > Command Generate Config Getter', () => {
  describe('with a command with a "connectionUrl" option', () => {
    it('should require [dbConnectionUrl, dbSchema, ssl, mongodbSrv, appName, appHostname, appPort]', () => {
      const commandGenerateConfigGetter = new CommandGenerateConfigGetter({ connectionUrl: 'postgres://forest:secret@localhost:5435/forest' });
      expect(commandGenerateConfigGetter.getOptions()).to.eql([
        'dbConnectionUrl',
        'dbSchema',
        'ssl',
        'mongodbSrv',
        'appName',
        'appHostname',
        'appPort',
      ]);
    });
  });

  describe('with a command with a "no database" option', () => {
    it('should require [appName, appHostname, appPort]', () => {
      const commandGenerateConfigGetter = new CommandGenerateConfigGetter({ db: false });
      expect(commandGenerateConfigGetter.getOptions()).to.eql([
        'appName',
        'appHostname',
        'appPort',
      ]);
    });
  });

  describe('with a command with no options', () => {
    it('should require [dbDialect, dbName, dbHostname, dbPort, dbUser, dbPassword, dbSchema, ssl, mongodbSrv, appName, appHostname, appPort]', () => {
      const commandGenerateConfigGetter = new CommandGenerateConfigGetter({ db: true });
      expect(commandGenerateConfigGetter.getOptions()).to.eql([
        'dbDialect',
        'dbName',
        'dbHostname',
        'dbPort',
        'dbUser',
        'dbPassword',
        'dbSchema',
        'ssl',
        'mongodbSrv',
        'appName',
        'appHostname',
        'appPort',
      ]);
    });
  });
});
