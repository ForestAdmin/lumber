/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
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

  async given(_fixtures) {
    /*
    await this.sequelize.drop();
    // fixtures.reduce((p, fn) => p.then(fn()), Promise.resolve());

    for (let i = 0; i < fixtures.length; i++) {
      await fixtures[i].sync({ force: true })
    }
    */

    // return Promise.all(fixtures.map(fixture => fixture.sync({ force: true })));
  }

  close() {
    this.sequelize.close();
  }

  async dropAllTables() {
    await this.sequelize.drop();
  }
}

module.exports = SequelizeHelper;
