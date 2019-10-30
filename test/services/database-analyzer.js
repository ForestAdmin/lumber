/* global describe, before, beforeEach, after, it */
const { expect } = require('chai');

const MongoHelper = require('../utils/mongo-helper');
const DatabaseAnalyzer = require('../../services/database-analyzer');
const basicModel = require('../fixtures/basic-model');
const expectedSimpleModelResult = require('../expected/expected-simple-model-result.json');

describe('Database analyser > MongoDB', () => {
  let mongoHelper;
  let databaseConnection;

  before(async () => {
    mongoHelper = new MongoHelper();
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

  it('should generate a basic model', async () => {
    await mongoHelper.given(basicModel);
    const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
    const model = await databaseAnalyzer.perform();
    expect(model).is.deep.equal(expectedSimpleModelResult);
  });
});
