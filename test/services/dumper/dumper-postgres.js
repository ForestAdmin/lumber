const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');

const renderingModel = require('../../expected/renderings-sequelize.json');
const Dumper = require('../../../services/dumper');

let dumper;

before(async () => {
  dumper = await new Dumper({
    appName: 'test/output/postgres',
    dbDialect: 'postgres',
    dbConnectionUrl: 'postgres://localhost:27017',
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

describe('Dumper > Postgres', () => {
  it('generate a model file', async () => {
    await dumper.dump(renderingModel);
    const renderingsGeneratedFile = fs.readFileSync('./test/output/postgres/models/renderings.js', 'utf8');
    const renderingsExpectedFile = fs.readFileSync('./test/expected/renderings-sequelize.js.expected', 'utf-8');
    expect(renderingsGeneratedFile).to.equals(renderingsExpectedFile);
  });
});
