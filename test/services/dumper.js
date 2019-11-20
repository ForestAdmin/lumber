/* global describe, after, it */
const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const { films: hasManyModel } = require('../expected/db-analysis-output/hasmany.json');
const { films: simpleModel } = require('../expected/db-analysis-output/simple.json');
const Dumper = require('../../services/dumper');

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
  it('generate a simple model', async () => {
    await dumper.dump('films', simpleModel);

    const generatedByDumper = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const expectedDumperOutput = fs.readFileSync('./test/expected/dumper-output/films-js', 'utf-8');

    expect(generatedByDumper).to.equals(expectedDumperOutput);
  });

  it('generate a model with hasmany', async () => {
    await dumper.dump('films', hasManyModel);

    const generatedByDumper = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const expectedDumperOutput = fs.readFileSync('./test/expected/dumper-output/films-hasmany-js', 'utf-8');

    expect(generatedByDumper).to.equals(expectedDumperOutput);
  });
});
