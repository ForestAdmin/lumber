const { expect } = require('chai');

const MongoHelper = require('../utils/mongo-helper');
const { describeMongoDatabases } = require('../utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../services/database-analyzer');
const simpleModel = require('../fixtures/simple-model');
const multipleReferencesModel = require('../fixtures/multiple-references-same-field-model');
const manyNullsModel = require('../fixtures/many-nulls-model');
const complexModel = require('../fixtures/many-objectid-fields-model');
const expectedSimpleGeneratedModel = require('../expected/simple-generated-model.json');
const expectedMultipleReferencesGeneratedModel = require('../expected/multiple-references-same-field-generated-model.json');
const expectedManyuNullsGeneratedModel = require('../expected/many-nulls-generated-model.json');
const expectedManyObjectIDFieldsGeneratedModel = require('../expected/many-objectid-fields-generated-model.json');

describe('Database analyser > MongoDB', () => {
  describeMongoDatabases(mongoUrl => () => {
    let mongoHelper;
    let databaseConnection;

    before(async () => {
      mongoHelper = new MongoHelper(mongoUrl);
      databaseConnection = await mongoHelper.connect();
    });

    beforeEach(() => mongoHelper.dropAllCollections());

    after(() => {
      databaseConnection = null;
      mongoHelper.close();
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
      expect(model).is.deep.equal(expectedSimpleGeneratedModel);
    });

    it('should not create a reference if multiples referenced collections are found', async () => {
      await mongoHelper.given(multipleReferencesModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedMultipleReferencesGeneratedModel);
    });

    it('should find the reference even in a db with many nulls', async () => {
      await mongoHelper.given(manyNullsModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedManyuNullsGeneratedModel);
    });

    it('should generate the model with many objectid fields', async () => {
      await mongoHelper.given(complexModel);
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedManyObjectIDFieldsGeneratedModel);
    });
  });
});
