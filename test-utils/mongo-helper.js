const { MongoClient } = require('mongodb');
const assert = require('assert');

const dbName = 'forest-test';

class MongoHelper {
  constructor(url) {
    this.url = url;
  }

  connect() {
    this.client = new MongoClient(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
    return new Promise((resolve) => {
      this.client.connect((err) => {
        assert.equal(null, err);
        this.db = this.client.db(dbName);
        resolve(this.db);
      });
    });
  }

  given(fixtures) {
    return Promise.all(Object.keys(fixtures).map((collectionName) =>
      this.insertDocs(collectionName, fixtures[collectionName])));
  }

  insertDocs(collectionName, docs) {
    return this.db
      .collection(collectionName)
      .insertMany(docs, { ordered: false });
  }

  close() {
    this.db = null;
    return this.client.close();
  }

  async dropAllCollections() {
    const collections = await this.db.listCollections().toArray();
    return Promise.all(collections
      // System collections are not droppable…
      .filter(({ name }) => !name.startsWith('system.'))
      // …other collections are.
      .map(({ name }) => this.db.collection(name).drop()));
  }
}

module.exports = MongoHelper;
