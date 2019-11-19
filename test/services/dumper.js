/* global describe, after, it */
const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const expectedSimpleGeneratedModel = require('../expected/simple-generated-model.json');
const Dumper = require('../../services/dumper');

after(() => {
  rimraf.sync('./test/output');
});

describe('Dumper > MongoDB', () => {
  it('generate a model file', async () => {
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

    const dumper = await new Dumper(config);
    await dumper.dump(expectedSimpleGeneratedModel);

    const filmsGeneratedFile = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const filmsExpectedFile = fs.readFileSync('./test/expected/films.js.expected', 'utf-8');
    expect(filmsGeneratedFile).to.equals(filmsExpectedFile);
  });
});
