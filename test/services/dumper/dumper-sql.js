/* global describe, before, after, it */
const { expect } = require('chai');
// const rimraf = require('rimraf');
const fs = require('fs');

const belongsToModel = require('../../expected/sql/db-analysis-output/belongs-to.json');
const othersModel = require('../../expected/sql/db-analysis-output/others.json');
const junctionTableModel = require('../../expected/sql/db-analysis-output/junction-table.json');

const Dumper = require('../../../services/dumper');

let dumper;

before(async () => {
  dumper = await new Dumper({
    appName: 'test/output/sql',
    dbDialect: 'postgres',
    dbConnectionUrl: 'postgres://localhost:27017',
    ssl: false,
    dbSchema: 'public',
    appHostname: 'localhost',
    appPort: 1654,
    db: true,
  });
});

// after(() => {
//   rimraf.sync('./test/output');
// });

describe('Dumper > SQL', () => {
  it('generate a model file with belongsTo associations', async () => {
    await dumper.dump(belongsToModel);
    const generatedFile = fs.readFileSync('./test/output/sql/models/belongs-to.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/sql/dumper-output/belongs-to', 'utf-8');

    expect(generatedFile).to.equals(expectedFile);
  });

  it('generate a model file with hasMany, hasOne and belongsToMany', async () => {
    await dumper.dump(othersModel);
    const generatedFile = fs.readFileSync('./test/output/sql/models/others.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/sql/dumper-output/others', 'utf-8');

    expect(generatedFile).to.equals(expectedFile);
  });

  it('generate a model file for a junction table', async () => {
    await dumper.dump(junctionTableModel);
    const generatedFile = fs.readFileSync('./test/output/sql/models/junction-table.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/sql/dumper-output/junction-table', 'utf-8');

    expect(generatedFile).to.equals(expectedFile);
  });
});
