const rimraf = require('rimraf');
const fs = require('fs');

const simpleModel = require('../../expected/mongo/db-analysis-output/simple.json');
const hasManyModel = require('../../expected/mongo/db-analysis-output/hasmany.json');
const Dumper = require('../../../services/dumper');

function getDumper() {
  return new Dumper({
    appName: 'test/output/mongo',
    dbDialect: 'mongodb',
    dbConnectionUrl: 'mongodb://localhost:27017',
    ssl: false,
    dbSchema: 'public',
    appHostname: 'localhost',
    appPort: 1654,
  });
}

function cleanOutput() {
  rimraf.sync('./test/output/mongo');
}

describe('services > dumper > MongoDB', () => {
  it('should generate a simple model file', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(simpleModel);
    const generatedFile = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/mongo/dumper-output/simple-js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate a model file with hasmany', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(hasManyModel);
    const generatedFile = fs.readFileSync('./test/output/mongo/models/films.js', 'utf8');
    const expectedFile = fs.readFileSync('./test/expected/mongo/dumper-output/hasmany-js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    // cleanOutput();
  });

  describe('handling /models/index.js file', () => {
    it('should not force type casting', async () => {
      expect.assertions(1);
      const indexGeneratedFile = fs.readFileSync('./test/output/mongo/models/index.js', 'utf-8');
      expect(indexGeneratedFile).toStrictEqual(expect.not.stringMatching('databaseOptions.dialectOptions.typeCast'));
      cleanOutput();
    });
  });
});
