/* global describe, before, after, it */
const { expect } = require('chai');

const MongoConnection = require('../utils/mongo-connect');

describe('Database analyser > MongoDB', () => {
  let mongoConnection;
  let databaseConnection;

  before(async () => {
    mongoConnection = new MongoConnection();
    databaseConnection = await mongoConnection.connect();
  });

  after(() => {
    databaseConnection = null;
    mongoConnection.close();
  });

  it('should connect and insert a document.', async () => {
    databaseConnection.collection('connect_test').insertOne({ name: 'hello' });
    const doc = await databaseConnection.collection('connect_test').findOne({ name: 'hello' });

    expect(doc.name).to.be.equal('hello');
  });
});
