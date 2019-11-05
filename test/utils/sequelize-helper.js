const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

class SequelizeHelper {
  connect(url) {
    this.sequelize = new Sequelize(url, {
      logging: false,
      pool: { maxConnections: 10, minConnections: 1 },
      dialectOptions: {
        multipleStatements: true,
      },
    });
    return new Promise((resolve, reject) => {
      this.sequelize.authenticate()
        .then(() => resolve(this.sequelize))
        .catch(err => reject(err));
    });
  }

  async given(tableName) {
    const dialect = this.sequelize.getDialect();
    const fixtureFilename = path.join(__dirname, `../fixtures/${dialect}/${tableName}.sql`);
    const expectedFilename = path.join(__dirname, `../expected/${dialect}/${tableName}.json`);
    const fixtureFileContent = await fs.readFileSync(fixtureFilename, 'utf8');
    await this.sequelize.query(`DROP TABLE IF EXISTS ${tableName}`);
    await this.sequelize.query(fixtureFileContent);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(expectedFilename);
  }

  close() {
    this.sequelize.close();
  }

  async dropAllTables() {
    await this.sequelize.drop();
  }
}

module.exports = SequelizeHelper;
