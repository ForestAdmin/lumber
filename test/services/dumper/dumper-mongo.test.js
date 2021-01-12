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
const context = require('../../../context');
const initContext = require('../../../context/init');

initContext(context);
const injectedContext = context.inject();

function getDumper() {
  return new Dumper(injectedContext);
}

const CONFIG = {
  appName: 'test-output/mongo',
  dbDialect: 'mongodb',
  dbConnectionUrl: 'mongodb://localhost:27017',
  ssl: false,
  dbSchema: 'public',
  appHostname: 'localhost',
  appPort: 1654,
};

function cleanOutput() {
  rimraf.sync('./test-output/mongo');
}

async function getGeneratedFileFromPersonModel(model) {
  const dumper = getDumper();
  await dumper.dump(model, CONFIG);
  return fs.readFileSync('./test-output/mongo/models/persons.js', 'utf8');
}

const TEST_OUTPUT_MODEL_FILMS_PATH = './test-output/mongo/models/films.js';
const TEST_EXPECTED_MODEL_FILMS_PATH = './test-expected/mongo/dumper-output/simple.expected.js';

describe('services > dumper > MongoDB', () => {
  it('should generate a simple model file', async () => {
    expect.assertions(1);
    const dumper = getDumper();
    await dumper.dump(simpleModel, CONFIG);
    const generatedFile = fs.readFileSync(TEST_OUTPUT_MODEL_FILMS_PATH, 'utf8');
    const expectedFile = fs.readFileSync(TEST_EXPECTED_MODEL_FILMS_PATH, 'utf8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('should generate a model file with hasMany', async () => {
    expect.assertions(1);
    const dumper = getDumper();
    await dumper.dump(hasManyModel, CONFIG);
    const generatedFile = fs.readFileSync(TEST_OUTPUT_MODEL_FILMS_PATH, 'utf8');
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/hasmany.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  describe('handling /models/index.js file', () => {
    it('should not force type casting', async () => {
      expect.assertions(1);
      const dumper = await getDumper();
      await dumper.dump(simpleModel, CONFIG);
      const indexGeneratedFile = fs.readFileSync('./test-output/mongo/models/index.js', 'utf-8');

      expect(indexGeneratedFile).toStrictEqual(expect.not.stringMatching('databaseOptions.dialectOptions.typeCast'));
      cleanOutput();
    });

    it('should generate a model/index.js file', async () => {
      expect.assertions(1);
      const dumper = await getDumper();
      await dumper.dump(simpleModel, CONFIG);
      const indexGeneratedFile = fs.readFileSync('./test-output/mongo/models/index.js', 'utf-8');
      const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/index.expected.js', 'utf-8');

      expect(indexGeneratedFile).toStrictEqual(expectedFile);
      cleanOutput();
    });

    it('should generate a config/databases.js file', async () => {
      expect.assertions(1);
      const dumper = await getDumper();
      await dumper.dump(simpleModel, CONFIG);
      const indexGeneratedFile = fs.readFileSync('./test-output/mongo/config/databases.js', 'utf-8');
      const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/databases.config.expected.js', 'utf-8');

      expect(indexGeneratedFile).toStrictEqual(expectedFile);
      cleanOutput();
    });
  });

  it('generate a model file with a nested object', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(nestedObjectModel);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/nested-object.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with a nested array of numbers', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(nestedArrayOfNumbersModel);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/nested-array-of-numbers.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with a nested array of objects', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(nestedArrayOfObjectsModel);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/nested-array-of-objects.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with a deep nested objects/array', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(deepNestedModel);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/deep-nested.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocuments using _ids', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(subDocumentsUsingIds);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-documents-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocuments not using _ids', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(subDocumentsNotUsingIds);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-documents-not-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocuments with ambiguous _ids', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(subDocumentsAmbiguousIds);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-documents-ambiguous-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocument using _ids', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(subDocumentUsingIds);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-document-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  it('generate a model file with subDocument not using _ids', async () => {
    expect.assertions(1);
    const generatedFile = await getGeneratedFileFromPersonModel(subDocumentNotUsingIds);
    const expectedFile = fs.readFileSync('./test-expected/mongo/dumper-output/sub-document-not-using-ids.expected.js', 'utf-8');

    expect(generatedFile).toStrictEqual(expectedFile);
    cleanOutput();
  });

  describe('on re-dump', () => {
    it('should recreate files that have been deleted', async () => {
      expect.assertions(1);

      // Setup test by dumping once to ensure all files exists, then remove a file
      const dumper = getDumper();
      await dumper.dump(simpleModel, CONFIG);
      fs.unlinkSync(TEST_OUTPUT_MODEL_FILMS_PATH);

      await dumper.dump(simpleModel, { ...CONFIG, isUpdate: true });
      const generatedFile = fs.readFileSync(TEST_OUTPUT_MODEL_FILMS_PATH, 'utf8');
      const expectedFile = fs.readFileSync(TEST_EXPECTED_MODEL_FILMS_PATH, 'utf8');

      // Then we ensure that the file that were removed exists after a redump
      expect(generatedFile).toStrictEqual(expectedFile);
      cleanOutput();
    });
  });
});
