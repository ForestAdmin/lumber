const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const renderingModel = require('../../expected/sql/renderings-sequelize.json');
const Dumper = require('../../../services/dumper');

after(() => {
  rimraf.sync('./test/output/mssql');
  rimraf.sync('./test/output/mysql');
  rimraf.sync('./test/output/postgres');
});

describe('Dumper > SQL', () => {
  describe('MySQL', () => {
    describe('Handling /models/index.js file', () => {
      let dumper;

      before(async () => {
        const config = {
          appName: 'test/output/mysql',
          dbDialect: 'mysql',
          dbConnectionUrl: 'mysql://localhost:8999',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
        };

        dumper = await new Dumper(config);

        await dumper.dump({});
      });

      it('Should force type casting for boolean', () => {
        const indexGeneratedFile = fs.readFileSync('./test/output/mysql/models/index.js', 'utf-8');

        expect(indexGeneratedFile).to.include('databaseOptions.dialectOptions.typeCast');
      });
    });
  });

  describe('MSSQL', () => {
    describe('Handling /models/index.js file', () => {
      let dumper;

      before(async () => {
        const config = {
          appName: 'test/output/mssql',
          dbDialect: 'mssql',
          dbConnectionUrl: 'mssql://localhost:1432',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
        };

        dumper = await new Dumper(config);

        await dumper.dump({});
      });

      it('Should not force type casting', () => {
        const indexGeneratedFile = fs.readFileSync('./test/output/mssql/models/index.js', 'utf-8');

        expect(indexGeneratedFile).to.not.include('databaseOptions.dialectOptions.typeCast');
      });
    });
  });

  describe('postgreSQL', () => {
    let dumper;

    before(async () => {
      const config = {
        appName: 'test/output/postgres',
        dbDialect: 'postgres',
        dbConnectionUrl: 'postgres://localhost:54369',
        ssl: false,
        dbSchema: 'public',
        appHostname: 'localhost',
        appPort: 1654,
      };

      dumper = await new Dumper(config);

      await dumper.dump({});
    });

    it('generate a model file', async () => {
      await dumper.dump(renderingModel);
      const renderingsGeneratedFile = fs.readFileSync('./test/output/postgres/models/renderings.js', 'utf8');
      const renderingsExpectedFile = fs.readFileSync('./test/expected/sql/dumper-output/renderings-sequelize.js.expected', 'utf-8');
      expect(renderingsGeneratedFile).to.equals(renderingsExpectedFile);
    });

    describe('Handling /models/index.js file', () => {
      it('Should not force type casting', () => {
        const indexGeneratedFile = fs.readFileSync('./test/output/postgres/models/index.js', 'utf-8');

        expect(indexGeneratedFile).to.not.include('databaseOptions.dialectOptions.typeCast');
      });
    });
  });
});
