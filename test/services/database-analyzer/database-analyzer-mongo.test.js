const MongoHelper = require('../../../test-utils/mongo-helper');
const { DATABASE_URL_MONGODB_MAX } = require('../../../test-utils/database-urls');
const { describeMongoDatabases } = require('../../../test-utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/analyzer/database-analyzer');
const simpleModel = require('../../../test-fixtures/mongo/simple-model');
const hasManyModel = require('../../../test-fixtures/mongo/hasmany-model');
const multipleReferencesModel = require('../../../test-fixtures/mongo/multiple-references-same-field-model');
const manyNullsModel = require('../../../test-fixtures/mongo/many-nulls-model');
const complexModel = require('../../../test-fixtures/mongo/many-objectid-fields-model');
const nestedObjectModel = require('../../../test-fixtures/mongo/nested-object-model');
const nestedArrayOfObjectsModel = require('../../../test-fixtures/mongo/nested-array-of-objects-model');
const nestedArrayOfNumbersModel = require('../../../test-fixtures/mongo/nested-array-of-numbers-model');
const deepNestedModel = require('../../../test-fixtures/mongo/deep-nested-model');
const multipleNestedArrayOfObjectsModel = require('../../../test-fixtures/mongo/multiple-nested-array-of-objects-model');
const subDocumentNotUsingIdsModel = require('../../../test-fixtures/mongo/sub-document-not-using-ids-model');
const subDocumentsAmbiguousIdsModel = require('../../../test-fixtures/mongo/sub-documents-ambiguous-ids-model');
const subDocumentsUsingIdsModel = require('../../../test-fixtures/mongo/sub-documents-using-ids-model');
const subDocumentsNotUsingIdsModel = require('../../../test-fixtures/mongo/sub-documents-not-using-ids-model');
const subDocumentUsingIdsModel = require('../../../test-fixtures/mongo/sub-document-using-ids-model');
const expectedSimpleModel = require('../../../test-expected/mongo/db-analysis-output/simple.expected.json');
const expectedHasManyModel = require('../../../test-expected/mongo/db-analysis-output/hasmany.expected.json');
const expectedMultipleReferencesModel = require('../../../test-expected/mongo/db-analysis-output/multiple-references-from-same-field.expected.json');
const expectedManyNullsModel = require('../../../test-expected/mongo/db-analysis-output/many-nulls.expected.json');
const expectedManyObjectIDFieldsModel = require('../../../test-expected/mongo/db-analysis-output/many-objectid-fields.expected.json');
const expectedNestedObjectModel = require('../../../test-expected/mongo/db-analysis-output/nested-object-fields.expected.json');
const expectedNestedArrayOfObjectsModel = require('../../../test-expected/mongo/db-analysis-output/nested-array-of-objects-fields.expected.json');
const expectedNestedArrayOfNumbersModel = require('../../../test-expected/mongo/db-analysis-output/nested-array-of-numbers-fields.expected.json');
const expectedDeepNestedModel = require('../../../test-expected/mongo/db-analysis-output/deep-nested-fields.expected.json');
const expectedMultipleNestedArrayOfObjectsModel = require('../../../test-expected/mongo/db-analysis-output/multiple-nested-array-of-objects-fields.expected.json');
const expectedSubDocumentNotUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-document-not-using-ids.expected');
const expectedSubDocumentsAmbiguousIds = require('../../../test-expected/mongo/db-analysis-output/sub-documents-ambiguous-ids.expected');
const expectedSubDocumentsUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-documents-using-ids.expected');
const expectedSubDocumentsNotUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-documents-not-using-ids.expected');
const expectedSubDocumentUsingIds = require('../../../test-expected/mongo/db-analysis-output/sub-document-using-ids.expected');
const expectedComplexModelWithAView = require('../../../test-expected/mongo/db-analysis-output/complex-model-with-a-view.expected');

function getMongoHelper(mongoUrl) {
  return new MongoHelper(mongoUrl);
}

async function getAnalyzerOutput(mongoUrl, callback) {
  const mongoHelper = await getMongoHelper(mongoUrl);
  const databaseConnection = await mongoHelper.connect();
  await mongoHelper.dropAllCollections();
  await callback(mongoHelper);
  const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
  const outputModel = await databaseAnalyzer.perform();
  await mongoHelper.close();
  return outputModel;
}

async function getAnalyzerOutputWithModel(mongoUrl, model) {
  return getAnalyzerOutput(mongoUrl, async (mongoHelper) => mongoHelper.given(model));
}

describe('services > database analyser > MongoDB', () => {
  describeMongoDatabases((mongoUrl) => () => {
    it('should connect and insert a document.', async () => {
      expect.assertions(1);
      const mongoHelper = await getMongoHelper(mongoUrl);
      const databaseConnection = await mongoHelper.connect();
      await mongoHelper.dropAllCollections();
      await databaseConnection.collection('connect_test').insertOne({ name: 'hello' });
      const doc = await databaseConnection.collection('connect_test').findOne({ name: 'hello' });
      await mongoHelper.close();
      expect(doc.name).toStrictEqual('hello');
    });

    it('should generate a simple model', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, simpleModel);
      expect(outputModel).toStrictEqual(expectedSimpleModel);
    });

    it('should generate a model with hasMany', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, hasManyModel);
      expect(outputModel).toStrictEqual(expectedHasManyModel);
    });

    it('should not create a reference if multiples referenced collections are found', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, multipleReferencesModel);
      expect(outputModel).toStrictEqual(expectedMultipleReferencesModel);
    });

    it('should find the reference even in a db with many nulls', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, manyNullsModel);
      expect(outputModel).toStrictEqual(expectedManyNullsModel);
    });

    it('should generate the model with many objectId fields', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, complexModel);
      expect(outputModel).toStrictEqual(expectedManyObjectIDFieldsModel);
    });

    it('should generate the model with a nested object', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, nestedObjectModel);
      expect(outputModel).toStrictEqual(expectedNestedObjectModel);
    });

    it('should generate the model with a nested array of numbers', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, nestedArrayOfNumbersModel);
      expect(outputModel).toStrictEqual(expectedNestedArrayOfNumbersModel);
    });

    it('should generate the model with a nested array of objects', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, nestedArrayOfObjectsModel);
      expect(outputModel).toStrictEqual(expectedNestedArrayOfObjectsModel);
    });

    it('should generate the model with a deep nested objects/arrays', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, deepNestedModel);
      expect(outputModel).toStrictEqual(expectedDeepNestedModel);
    });

    it('should generate the model with multiple records containing deep nested objects/arrays', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(
        mongoUrl,
        multipleNestedArrayOfObjectsModel,
      );
      expect(outputModel).toStrictEqual(expectedMultipleNestedArrayOfObjectsModel);
    });

    it('should generate the model with subDocuments using ids', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, subDocumentsUsingIdsModel);
      expect(outputModel).toStrictEqual(expectedSubDocumentsUsingIds);
    });

    it('should generate the model with subDocuments not using ids', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, subDocumentsNotUsingIdsModel);
      expect(outputModel).toStrictEqual(expectedSubDocumentsNotUsingIds);
    });

    it('should generate the model with subDocument not using ids', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, subDocumentNotUsingIdsModel);
      expect(outputModel).toStrictEqual(expectedSubDocumentNotUsingIds);
    });

    it('should generate the model with subDocument using ids', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, subDocumentUsingIdsModel);
      expect(outputModel).toStrictEqual(expectedSubDocumentUsingIds);
    });

    it('should generate the model with subDocuments with ambiguous ids', async () => {
      expect.assertions(1);
      const outputModel = await getAnalyzerOutputWithModel(mongoUrl, subDocumentsAmbiguousIdsModel);
      expect(outputModel).toStrictEqual(expectedSubDocumentsAmbiguousIds);
    });
  });

  it('should ignore `system.*` collections created via views using Mongo Database > 3', async () => {
    expect.assertions(2);

    const outputModel = await getAnalyzerOutput(DATABASE_URL_MONGODB_MAX, async (mongoHelper) => {
      await mongoHelper.given(complexModel);
      await mongoHelper.db.createCollection('myView', { viewOn: 'films' });

      // Expect that system.views collection is actually present in database:
      // the purpose of this test is to ensure it has not been imported nor analyzed.
      // Still, listCollections() returns unauthorized views only since 4.0.
      expect((await mongoHelper.db.listCollections().toArray())
        .find((collection) => collection.name === 'system.views')).not.toBeUndefined();
    });

    // The output is expected to contain the view but not its system.view attached table.
    expect(outputModel).toStrictEqual(expectedComplexModelWithAView);
  });
});
