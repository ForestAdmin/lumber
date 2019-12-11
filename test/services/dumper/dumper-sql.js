const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const Dumper = require('../../../services/dumper');

after(() => {
  rimraf.sync('./test/output');
});

describe('Dumper > SQL', () => {
  describe('MySQL', () => {
    describe('Handling /models/index.js file', () => {
      let dumper;

      before(async () => {
        const config = {
          appName: 'test/output/mysql',
          dbDialect: 'mysql',
          dbConnectionUrl: 'mysql://localhost:3306',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
          db: true,
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
          dbConnectionUrl: 'mysql://localhost:1433',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
          db: true,
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

  describe('postgresSQL', () => {
    describe('Handling /models/index.js file', () => {
      let dumper;

      before(async () => {
        const config = {
          appName: 'test/output/postgres',
          dbDialect: 'postgres',
          dbConnectionUrl: 'mysql://localhost:5432',
          ssl: false,
          dbSchema: 'public',
          appHostname: 'localhost',
          appPort: 1654,
          db: true,
        };

        dumper = await new Dumper(config);

        await dumper.dump({});
      });

      it('Should not force type casting', () => {
        const indexGeneratedFile = fs.readFileSync('./test/output/postgres/models/index.js', 'utf-8');

        expect(indexGeneratedFile).to.not.include('databaseOptions.dialectOptions.typeCast');
      });
    });
  });
});
