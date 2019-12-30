const rimraf = require('rimraf');
const fs = require('fs');

const simpleModel = require('../../expected/sequelize/db-analysis-output/customers.json');
const belongsToModel = require('../../expected/sequelize/db-analysis-output/addresses.json');
const otherAssociationsModel = require('../../expected/sequelize/db-analysis-output/users.json');

const Dumper = require('../../../services/dumper');

function getDumper() {
  return new Dumper({
    appName: 'test/output/sequelize',
    dbDialect: 'postgres',
    dbConnectionUrl: 'postgres://localhost:27017',
    ssl: false,
    dbSchema: 'public',
    appHostname: 'localhost',
    appPort: 1654,
    db: true,
  });
}

function cleanOutput() {
  rimraf.sync('./test/output/sequelize');
}

describe('services > dumper > sequelize', () => {
  it('should generate a simple model file', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(simpleModel);
    const generatedFile = fs.readFileSync('./test/output/sequelize/models/customers.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/sequelize/dumper-output/customers.js.expected', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate a model file with belongsTo associations', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(belongsToModel);
    const generatedFile = fs.readFileSync('./test/output/sequelize/models/addresses.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/sequelize/dumper-output/addresses.js.expected', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate a model file with hasMany, hasOne and belongsToMany', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(otherAssociationsModel);
    const generatedFile = fs.readFileSync('./test/output/sequelize/models/users.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/sequelize/dumper-output/users.js.expected', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });
});
