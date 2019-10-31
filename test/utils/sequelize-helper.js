const Sequelize = require('sequelize');

class SequelizeHelper {
  async connect(url, options) {
    this.sequelize = new Sequelize(url, {
      logging: false,
      pool: { maxConnections: 10, minConnections: 1 },
    });
    return new Promise((resolve, reject) => {
      this.sequelize.authenticate()
        .then(() => resolve(this.sequelize))
        .catch(err => reject(err));
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
    this.sequelize.close();
  }

  dropAllTables() {
    return this.sequelize.drop();
  }
}

module.exports = SequelizeHelper;