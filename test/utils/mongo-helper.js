const { MongoClient } = require('mongodb');
const assert = require('assert');

const url = process.env.DATABASE_CONNECTION_URL || 'mongodb://localhost:27017';
const dbName = 'forest-test';

class MongoHelper {
  connect() {
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    return new Promise((resolve) => {
      this.client.connect((err) => {
        assert.equal(null, err);
        this.db = this.client.db(dbName);
        resolve(this.db);
      });
    });
  }

  given(fixtures) {
    return Promise.all(Object.keys(fixtures).map(collectionName =>
      this.insertDocs(collectionName, fixtures[collectionName])));
  }

  insertDocs(collectionName, docs) {
    return this.db
      .collection(collectionName)
      .insertMany(docs, { ordered: false });
  }

  close() {
    this.db = null;
    this.client.close();
  }

  async dropAllCollections() {
    const collections = await this.db.listCollections().toArray();
    return Promise.all(collections.map(({ name }) => this.db.collection(name).drop()));
  }
}

module.exports = MongoHelper;
