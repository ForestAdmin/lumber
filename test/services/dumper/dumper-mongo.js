/* global describe, after, before, it */
const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const simpleModel = require('../../expected/mongo/db-analysis-output/simple.json');
const hasManyModel = require('../../expected/mongo/db-analysis-output/hasmany.json');
const Dumper = require('../../../services/dumper');

let dumper;

before(async () => {
  dumper = await new Dumper({
    appName: 'test/output/mongo',
    dbDialect: 'mongodb',
    dbConnectionUrl: 'mongodb://localhost:27017',
    ssl: false,
    dbSchema: 'public',
    appHostname: 'localhost',
    appPort: 1654,
    db: true,
  });
});

after(() => {
  rimraf.sync('./test/output');
});

describe('Dumper > MongoDB', () => {
  it('generate a simple model file', async () => {
    await dumper.dump(simpleModel);
    const generatedFile = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/mongo/dumper-output/simple-js', 'utf-8');

    expect(generatedFile).to.exist;
    expect(generatedFile).to.equals(expectedFile);
  });

  it('generate a model file with hasmany', async () => {
    await dumper.dump(hasManyModel);
    const generatedFile = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/mongo/dumper-output/hasmany-js', 'utf-8');

    expect(generatedFile).to.exist;
    expect(generatedFile).to.equals(expectedFile);
  });

  describe('Handling /models/index.js file', () => {
    it('Should not force type casting', () => {
      const indexGeneratedFile = fs.readFileSync('./test/output/mongo/models/index.js', 'utf-8');

      expect(indexGeneratedFile).to.not.include('databaseOptions.dialectOptions.typeCast');
    });
  });
});