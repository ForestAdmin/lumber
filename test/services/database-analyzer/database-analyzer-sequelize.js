const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../../utils/sequelize-helper');
const { describeSequelizeDatabases } = require('../../utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/analyzer/database-analyzer');

describe('Database analyser > Sequelize', () => {
  describeSequelizeDatabases(({ connectionUrl, dialect }) => () => {
    function performDatabaseAnalysis(connection) {
      return new DatabaseAnalyzer(connection, { dbDialect: dialect }).perform();
    }
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
      await sequelizeHelper.forceSync(User);
      const user = await User.create({ name: 'Jane' });
      expect(user.name).to.be.equal('Jane');
    });

    it('should generate a single model', async () => {
      const expected = await sequelizeHelper.given('customers');
      const result = await performDatabaseAnalysis(databaseConnection);
      expect(result.customers).is.deep.equal(expected.customers);
    }).timeout(10000);

    it('should generate a model with a belongsTo association', async () => {
      const expected = await sequelizeHelper.given('addresses');
      const result = await performDatabaseAnalysis(databaseConnection);
      expect(result.addresses).is.deep.equal(expected.addresses);
    }).timeout(10000);

    it('should generate a model with hasOne, hasMany and belongsToMany associations', async () => {
      const expected = await sequelizeHelper.given('users');
      await sequelizeHelper.dropAndCreate('books');
      await sequelizeHelper.dropAndCreate('addresses');
      await sequelizeHelper.dropAndCreate('reviews');
      await sequelizeHelper.dropAndCreate('user_books');
      const result = await performDatabaseAnalysis(databaseConnection);
      expect(result.users).is.deep.equal(expected.users);
    }).timeout(10000);
  });
});
