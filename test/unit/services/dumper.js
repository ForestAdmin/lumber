/* global describe, after, it */
const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const expectedSimpleGeneratedModel = require('../../integration/expected/simple-generated-model.json');
const Dumper = require('../../../services/dumper');

after(() => {
  rimraf.sync('./test-tmp');
});

describe('Dumper > MongoDB', () => {
  it('generate a model file', async () => {
    const config = {
      appName: 'test-tmp/mongo-dumper',
      dbDialect: 'mongodb',
      dbConnectionUrl: 'mongodb://localhost:27017',
      ssl: false,
      dbSchema: 'public',
      appHostname: 'localhost',
      appPort: 1654,
      db: true,
    };
    const dumper = await new Dumper(config);
    await dumper.dump('films', expectedSimpleGeneratedModel.films);
    await dumper.dump('persons', expectedSimpleGeneratedModel.persons);

    const filmsGeneratedFile = fs.readFileSync('./test-tmp/mongo-dumper/models/films.js', 'utf8');
    const filmsExpectedFile = fs.readFileSync('./test/unit/expected/films.js.expected', 'utf-8');
    expect(filmsGeneratedFile).to.equals(filmsExpectedFile);
  });
});
