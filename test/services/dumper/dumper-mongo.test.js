const rimraf = require('rimraf');
const fs = require('fs');

const simpleModel = require('../../../test-expected/mongo/db-analysis-output/simple.expected.json');
const hasManyModel = require('../../../test-expected/mongo/db-analysis-output/hasmany.expected.json');
const nestedObjectModel = require('../../../test-expected/mongo/db-analysis-output/nested-object-fields.expected.json');
const nestedArrayOfNumbersModel = require('../../../test-expected/mongo/db-analysis-output/nested-array-of-numbers-fields.expected.json');
const nestedArrayOfObjectsModel = require('../../../test-expected/mongo/db-analysis-output/nested-array-of-objects-fields.expected.json');
const deepNestedModel = require('../../../test-expected/mongo/db-analysis-output/deep-nested-fields.expected.json');
const subDocumentNotUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-document-not-using-ids.expected');
const subDocumentsAmbiguousIds = require('../../../test-expected/mongo/db-analysis-output/sub-documents-ambiguous-ids.expected');
const subDocumentsNotUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-documents-not-using-ids.expected');
const subDocumentsUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-documents-using-ids.expected');
const subDocumentUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-document-using-ids.expected');
const Dumper = require('../../../services/dumper');

function getDumper() {
  return new Dumper({
    appName: 'test-output/mongo',
    dbDialect: 'mongodb',
    dbConnectionUrl: 'mongodb://localhost:27017',
    ssl: false,
    dbSchema: 'public',
    appHostname: 'localhost',
    appPort: 1654,
  });
}

function cleanOutput() {
  rimraf.sync('./test-output/mongo');
}

describe('services > dumper > MongoDB', () => {
  it('should generate a simple model file', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(simpleModel);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/films.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/simple.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate a model file with hasmany', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(hasManyModel);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/films.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/hasmany.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    // cleanOutput();
  });

  describe('handling /models/index.js file', () => {
    it('should not force type casting', async () => {
      expect.assertions(1);
      const indexGeneratedFile = fs.readFileSync('./test-output/mongo/models/index.js', 'utf-8');
      expect(indexGeneratedFile).toStrictEqual(expect.not.stringMatching('databaseOptions.dialectOptions.typeCast'));
      cleanOutput();
    });
  });

  it('generate a model file with a nested object', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(nestedObjectModel);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/nested-object.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with a nested array of numbers', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(nestedArrayOfNumbersModel);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/nested-array-of-numbers.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with a nested array of objects', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(nestedArrayOfObjectsModel);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/nested-array-of-objects.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with a deep nested objects/array', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(deepNestedModel);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/deep-nested.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocuments using _ids', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(subDocumentsUsingIds);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-documents-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocuments not using _ids', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(subDocumentsNotUsingIds);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-documents-not-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocuments with ambiguous _ids', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(subDocumentsAmbiguousIds);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-documents-ambiguous-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocument using _ids', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(subDocumentUsingIds);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-document-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocument not using _ids', async () => {
    expect.assertions(1);
    const dumper = await getDumper();
    await dumper.dump(subDocumentNotUsingIds);
    const generatedFile = fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-document-not-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });
});
