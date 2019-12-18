const MongoHelper = require('../../../test-utils/mongo-helper');
const { describeMongoDatabases } = require('../../../test-utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/analyzer/database-analyzer');
const simpleModel = require('../../../test-fixtures/mongo/simple-model');
const hasManyModel = require('../../../test-fixtures/mongo/hasmany-model');
const multipleReferencesModel = require('../../../test-fixtures/mongo/multiple-references-same-field-model');
const manyNullsModel = require('../../../test-fixtures/mongo/many-nulls-model');
const complexModel = require('../../../test-fixtures/mongo/many-objectid-fields-model');
const nestedObjectModel = require('../../../test-fixtures/mongo/nested-object-model');
const expectedSimpleModel = require('../../../test-expected/mongo/db-analysis-output/simple.expected.json');
const expectedHasManyModel = require('../../../test-expected/mongo/db-analysis-output/hasmany.expected.json');
const expectedMultipleReferencesModel = require('../../../test-expected/mongo/db-analysis-output/multiple-references-from-same-field.expected.json');
const expectedManyuNullsModel = require('../../../test-expected/mongo/db-analysis-output/many-nulls.expected.json');
const expectedManyObjectIDFieldsModel = require('../../../test-expected/mongo/db-analysis-output/many-objectid-fields.expected.json');
const expectedNestedObjectModel = require('../../../test-expected/mongo/db-analysis-output/nested-object-fields.expected.json');

function getMongoHelper(mongoUrl) {
  return new MongoHelper(mongoUrl);
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

      expect(doc.name).toStrictEqual('hello');
      await mongoHelper.close();
    });

    it('should generate a simple model', async () => {
      expect.assertions(1);
      const mongoHelper = await getMongoHelper(mongoUrl);
      const databaseConnection = await mongoHelper.connect();
      await mongoHelper.dropAllCollections();
      await mongoHelper.given(simpleModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).toStrictEqual(expectedSimpleModel);
      await mongoHelper.close();
    });

    it('should generate a model with hasmany', async () => {
      expect.assertions(1);
      const mongoHelper = await getMongoHelper(mongoUrl);
      const databaseConnection = await mongoHelper.connect();
      await mongoHelper.dropAllCollections();
      await mongoHelper.given(hasManyModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).toStrictEqual(expectedHasManyModel);
      await mongoHelper.close();
    });

    it('should not create a reference if multiples referenced collections are found', async () => {
      expect.assertions(1);
      const mongoHelper = await getMongoHelper(mongoUrl);
      const databaseConnection = await mongoHelper.connect();
      await mongoHelper.dropAllCollections();
      await mongoHelper.given(multipleReferencesModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).toStrictEqual(expectedMultipleReferencesModel);
      await mongoHelper.close();
    });

    it('should find the reference even in a db with many nulls', async () => {
      expect.assertions(1);
      const mongoHelper = await getMongoHelper(mongoUrl);
      const databaseConnection = await mongoHelper.connect();
      await mongoHelper.dropAllCollections();
      await mongoHelper.given(manyNullsModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).toStrictEqual(expectedManyuNullsModel);
      await mongoHelper.close();
    });

    it('should generate the model with many objectid fields', async () => {
      expect.assertions(1);
      const mongoHelper = await getMongoHelper(mongoUrl);
      const databaseConnection = await mongoHelper.connect();
      await mongoHelper.dropAllCollections();
      await mongoHelper.given(complexModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).toStrictEqual(expectedManyObjectIDFieldsModel);
      await mongoHelper.close();
    });

    it('should generate the model with a nested object', async () => {
      await mongoHelper.given(nestedObjectModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedNestedObjectModel);
    });
  });
});
