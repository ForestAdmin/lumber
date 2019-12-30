const MongoHelper = require('../../utils/mongo-helper');
const { describeMongoDatabases } = require('../../utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/analyzer/database-analyzer');
const simpleModel = require('../../fixtures/mongo/simple-model');
const hasManyModel = require('../../fixtures/mongo/hasmany-model');
const multipleReferencesModel = require('../../fixtures/mongo/multiple-references-same-field-model');
const manyNullsModel = require('../../fixtures/mongo/many-nulls-model');
const complexModel = require('../../fixtures/mongo/many-objectid-fields-model');
const expectedSimpleModel = require('../../expected/mongo/db-analysis-output/simple.json');
const expectedHasManyModel = require('../../expected/mongo/db-analysis-output/hasmany.json');
const expectedMultipleReferencesModel = require('../../expected/mongo/db-analysis-output/multiple-references-from-same-field.json');
const expectedManyuNullsModel = require('../../expected/mongo/db-analysis-output/many-nulls.json');
const expectedManyObjectIDFieldsModel = require('../../expected/mongo/db-analysis-output/many-objectid-fields.json');

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
  });
});
