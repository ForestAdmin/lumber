const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../../utils/sequelize-helper');
const { databases } = require('../../utils/databases-urls');
const DatabaseAnalyzer = require('../../../services/database-analyzer');

describe('Database analyser > Sequelize', () => {
  function performDatabaseAnalysis(connection, dialect) {
    const databaseAnalyzer = new DatabaseAnalyzer(connection, { dbDialect: dialect });
    return databaseAnalyzer.perform();
  }

  databases.forEach(({ connectionUrl, dialect }) => {
    describe(`with ${dialect}`, () => {
      let sequelizeHelper;
      let databaseConnection;

      before(async () => {
        sequelizeHelper = new SequelizeHelper();
        databaseConnection = await sequelizeHelper.connect(connectionUrl);
      });

      after(async () => {
        databaseConnection = null;
        await sequelizeHelper.close();
      });

      it('should connect and create a record.', async () => {
        const User = databaseConnection.define('user', { name: { type: Sequelize.STRING } });
        await User.sync({ force: true });
        const user = await User.create({ name: 'Jane' });
        expect(user.name).to.be.equal('Jane');
      });

      it('should generate a single model', async () => {
        const expected = await sequelizeHelper.given('customers');
        const result = await performDatabaseAnalysis(databaseConnection);
        expect(result.customers).is.deep.equal(expected);
      });

      it('should generate two models with relationship', async () => {
        await sequelizeHelper.given('customers');
        const expected = await sequelizeHelper.given('addresses');
        const result = await performDatabaseAnalysis(databaseConnection);
        expect(result.addresses).is.deep.equal(expected);
      });
    });
  });
});
