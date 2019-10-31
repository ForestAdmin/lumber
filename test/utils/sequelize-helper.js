const Sequelize = require('sequelize');

class SequelizeHelper {
  connect(url) {
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
    return Promise.all(fixtures.map((fixture) => {
      const Model = this.sequelize.define(fixture.name, fixture.attributes);
      return Model.sync({ force: true });
    }));
  }

  close() {
    this.sequelize.close();
  }

  dropAllTables() {
    return this.sequelize.drop();
  }
}

module.exports = SequelizeHelper;
