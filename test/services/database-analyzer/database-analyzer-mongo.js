const { expect } = require('chai');

const MongoHelper = require('../../utils/mongo-helper');
const { describeMongoDatabases } = require('../../utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/database-analyzer');
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

describe('Database analyser > MongoDB', () => {
  describeMongoDatabases((mongoUrl) => () => {
    let mongoHelper;
    let databaseConnection;

    before(async () => {
      mongoHelper = new MongoHelper(mongoUrl);
      databaseConnection = await mongoHelper.connect();
    });

    beforeEach(() => mongoHelper.dropAllCollections());

    after(async () => {
      databaseConnection = null;
      await mongoHelper.close();
    });

    it('should connect and insert a document.', async () => {
      await databaseConnection.collection('connect_test').insertOne({ name: 'hello' });
      const doc = await databaseConnection.collection('connect_test').findOne({ name: 'hello' });

      expect(doc.name).to.be.equal('hello');
    });

    it('should generate a simple model', async () => {
      await mongoHelper.given(simpleModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedSimpleModel);
    });

    it('should generate a model with hasmany', async () => {
      await mongoHelper.given(hasManyModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedHasManyModel);
    });

    it('should not create a reference if multiples referenced collections are found', async () => {
      await mongoHelper.given(multipleReferencesModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedMultipleReferencesModel);
    });

    it('should find the reference even in a db with many nulls', async () => {
      await mongoHelper.given(manyNullsModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedManyuNullsModel);
    });

    it('should generate the model with many objectid fields', async () => {
      await mongoHelper.given(complexModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedManyObjectIDFieldsModel);
    });
  });
});
