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

  async dropAllTables() {
    const isMysql = this.sequelize.getDialect() === 'mysql';
    if (isMysql) {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS=0;');
    }
    await this.sequelize.drop();
    if (isMysql) {
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS=1;');
    }
  }
}

module.exports = SequelizeHelper;
