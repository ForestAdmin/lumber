const { MongoClient } = require('mongodb');
const assert = require('assert');

const url = process.env.DATABASE_CONNECTION_URL || 'mongodb://localhost:27017';
const dbName = 'forest-test';

class MongoConnection {
  connect() {
    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    return new Promise((resolve) => {
      this.client.connect((err) => {
        assert.equal(null, err);
        resolve(this.db());
      });
    });
  }

  db() {
    return this.client.db(dbName);
  }

  close() {
    this.client.close();
  }
}

module.exports = MongoConnection;
