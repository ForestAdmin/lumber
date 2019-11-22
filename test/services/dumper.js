/* global describe, after, it, before */
const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const expectedSimpleGeneratedModel = require('../expected/simple-generated-model.json');
const renderingModel = require('../expected/renderings-sequelize.json');
const Dumper = require('../../services/dumper');

after(() => {
  rimraf.sync('./test/output');
});

describe('Dumper > MongoDB', () => {
  let dumper;

  before(async () => {
    const config = {
      appName: 'test/output/mongo',
      dbDialect: 'mongodb',
      dbConnectionUrl: 'mongodb://localhost:27017',
      ssl: false,
      dbSchema: 'public',
      appHostname: 'localhost',
      appPort: 1654,
      db: true,
    };

    dumper = await new Dumper(config);
  });

  it('generate a model file', async () => {
    await dumper.dump(expectedSimpleGeneratedModel);

    const filmsGeneratedFile = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const filmsExpectedFile = fs.readFileSync('./test/expected/films-mongo.js.expected', 'utf-8');
    expect(filmsGeneratedFile).to.equals(filmsExpectedFile);
  });

  describe('Handling /models/index.js file', () => {
    it('Should not force type casting', () => {
      const indexGeneratedFile = fs.readFileSync('./test/output/mongo/models/index.js', 'utf-8');

      expect(indexGeneratedFile).to.not.include('databaseOptions.dialectOptions.typeCast');
    });
  });
});

describe('Dumper > MySQL', () => {
  describe('Handling /models/index.js file', () => {
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

      await new Dumper(config);
    });

    it('Should force type casting for boolean', () => {
      const indexGeneratedFile = fs.readFileSync('./test/output/mysql/models/index.js', 'utf-8');

      expect(indexGeneratedFile).to.include('databaseOptions.dialectOptions.typeCast');
    });
  });
});

describe('Dumper > MSSQL', () => {
  describe('Handling /models/index.js file', () => {
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

      await new Dumper(config);
    });

    it('Should not force type casting', () => {
      const indexGeneratedFile = fs.readFileSync('./test/output/mssql/models/index.js', 'utf-8');

      expect(indexGeneratedFile).to.not.include('databaseOptions.dialectOptions.typeCast');
    });
  });
});

describe('Dumper > pgSQL', () => {
  describe('Handling /models/index.js file', () => {
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

      await new Dumper(config);
    });

    it('Should not force type casting', () => {
      const indexGeneratedFile = fs.readFileSync('./test/output/postgres/models/index.js', 'utf-8');

      expect(indexGeneratedFile).to.not.include('databaseOptions.dialectOptions.typeCast');
    });
  });
});

describe('Dumper > Postgres', () => {
  it('generate a model file', async () => {
    const config = {
      appName: 'test/output/postgres',
      dbDialect: 'postgres',
      dbConnectionUrl: 'postgres://localhost:27017',
      ssl: false,
      dbSchema: 'public',
      appHostname: 'localhost',
      appPort: 1654,
      db: true,
    };
    const dumper = await new Dumper(config);
    await dumper.dump(renderingModel);

    const renderingsGeneratedFile = fs.readFileSync('./test/output/postgres/models/renderings.js', 'utf8');
    const renderingsExpectedFile = fs.readFileSync('./test/expected/renderings-sequelize.js.expected', 'utf-8');
    expect(renderingsGeneratedFile).to.equals(renderingsExpectedFile);
  });
});
