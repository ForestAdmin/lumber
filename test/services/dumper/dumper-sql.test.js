const rimraf = require('rimraf');
const fs = require('fs');

const renderingModel = require('../../../test-expected/sequelize/db-analysis-output/renderings.expected.json');
const Dumper = require('../../../services/dumper');

function cleanOutput() {
  rimraf.sync('./test-output/mssql');
  rimraf.sync('./test-output/mysql');
  rimraf.sync('./test-output/postgres');
}

describe('services > dumper > SQL', () => {
  describe('database MySQL', () => {
    describe('handling /models/index.js file', () => {
      async function dump() {
        const config = {
          appName: 'test-output/mysql',
          dbDialect: 'mysql',
          dbConnectionUrl: 'mysql://localhost:8999',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
        };

        const dumper = await new Dumper(config);
        await dumper.dump({});
      }

      it('should force type casting for boolean', async () => {
        expect.assertions(1);
        await dump();
        const indexGeneratedFile = fs.readFileSync('./test-output/mysql/models/index.js', 'utf-8');

        expect(indexGeneratedFile).toStrictEqual(expect.stringMatching('databaseOptions.dialectOptions.typeCast'));
        cleanOutput();
      });
    });
  });

  describe('database MSSQL', () => {
    describe('handling /models/index.js file', () => {
      async function dump() {
        const config = {
          appName: 'test-output/mssql',
          dbDialect: 'mssql',
          dbConnectionUrl: 'mssql://localhost:1432',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
        };

        const dumper = await new Dumper(config);
        await dumper.dump({});
      }

      it('should not force type casting', async () => {
        expect.assertions(1);
        await dump();
        const indexGeneratedFile = fs.readFileSync('./test-output/mssql/models/index.js', 'utf-8');

        expect(indexGeneratedFile).toStrictEqual(expect.not.stringMatching('databaseOptions.dialectOptions.typeCast'));
        cleanOutput();
      });
    });
  });

  describe('database postgreSQL', () => {
    async function dump() {
      const config = {
        appName: 'test-output/postgres',
        dbDialect: 'postgres',
        dbConnectionUrl: 'postgres://localhost:54369',
        ssl: false,
        dbSchema: 'public',
        appHostname: 'localhost',
        appPort: 1654,
      };

      const dumper = await new Dumper(config);
      await dumper.dump(renderingModel);
    }

    it('should generate a model file', async () => {
      expect.assertions(1);
      await dump();
      const renderingsGeneratedFile = fs.readFileSync('./test-output/postgres/models/renderings.js', 'utf8');
      const renderingsExpectedFile = fs.readFileSync('./test-expected/sequelize/dumper-output/renderings.expected.js', 'utf-8');
      expect(renderingsGeneratedFile).toStrictEqual(renderingsExpectedFile);
    });

    describe('handling /models/index.js file', () => {
      it('should not force type casting', () => {
        expect.assertions(1);
        const indexGeneratedFile = fs.readFileSync('./test-output/postgres/models/index.js', 'utf-8');

        expect(indexGeneratedFile).toStrictEqual(expect.not.stringMatching('databaseOptions.dialectOptions.typeCast'));
        cleanOutput();
      });
    });
  });
});
