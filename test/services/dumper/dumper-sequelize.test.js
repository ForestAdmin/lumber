const rimraf = require('rimraf');
const fs = require('fs');

const simpleModel = require('../../../test-expected/sequelize/db-analysis-output/customers.expected.json');
const belongsToModel = require('../../../test-expected/sequelize/db-analysis-output/addresses.expected.json');
const otherAssociationsModel = require('../../../test-expected/sequelize/db-analysis-output/users.expected.json');
const exportModel = require('../../../test-expected/sequelize/db-analysis-output/export.expected.json');
const defaultValuesModel = require('../../../test-expected/sequelize/db-analysis-output/default-values.expected.js');

const Dumper = require('../../../services/dumper');

function getDumper() {
  return new Dumper({
    appName: 'test-output/sequelize',
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
  rimraf.sync('./test-output/sequelize');
}

describe('services > dumper > sequelize', () => {
  it('should generate a simple model file', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(simpleModel);
    const generatedFile = fs.readFileSync('./test-output/sequelize/models/customers.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/sequelize/dumper-output/customers.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate a model file with belongsTo associations', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(belongsToModel);
    const generatedFile = fs.readFileSync('./test-output/sequelize/models/addresses.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/sequelize/dumper-output/addresses.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate a model file with hasMany, hasOne and belongsToMany', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(otherAssociationsModel);
    const generatedFile = fs.readFileSync('./test-output/sequelize/models/users.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/sequelize/dumper-output/users.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should still generate a model file when reserved word is used', async () => {
    expect.assertions(2);
    const dumper = await getDumper();
    await dumper.dump(exportModel);
    const generatedModelFile = fs.readFileSync('./test-output/sequelize/models/export.js', 'utf8');
    const generatedRouteFile = fs.readFileSync('./test-output/sequelize/routes/export.js', 'utf8');
    const expectedModelFile = fs.readFileSync('./test-expected/sequelize/dumper-output/export.expected.js', 'utf-8');
    const expectedRouteFile = fs.readFileSync('./test-expected/sequelize/dumper-output/export.expected.route.js', 'utf-8');

    expect(generatedModelFile).toStrictEqual(expectedModelFile);
    expect(generatedRouteFile).toStrictEqual(expectedRouteFile);
    cleanOutput();
  });

  it('should generate a model with default values', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(defaultValuesModel);
    const generatedFile = fs.readFileSync('./test-output/sequelize/models/default-values.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/sequelize/dumper-output/default-values.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate the model index file', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(simpleModel);
    const generatedFile = fs.readFileSync('./test-output/sequelize/models/index.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/sequelize/dumper-output/index.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate the env file', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(simpleModel);
    const generatedFile = fs.readFileSync('./test-output/sequelize/.env', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/sequelize/dumper-output/env.expected', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });
});
