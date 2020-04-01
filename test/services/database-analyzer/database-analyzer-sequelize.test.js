const Sequelize = require('sequelize');
const SequelizeHelper = require('../../../test-utils/sequelize-helper');
const { describeSequelizeDatabases } = require('../../../test-utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/analyzer/database-analyzer');

describe('services > database analyser > Sequelize', () => {
  describeSequelizeDatabases(({ connectionUrl, dialect }) => () => {
    function performDatabaseAnalysis(connection) {
      return new DatabaseAnalyzer(connection, { dbDialect: dialect }).perform();
    }

    it('should connect and create a record.', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const User = databaseConnection.define('user', { name: { type: Sequelize.STRING } });
      await sequelizeHelper.forceSync(User);
      const user = await User.create({ name: 'Jane' });
      expect(user.name).toStrictEqual('Jane');
      await sequelizeHelper.close();
    });

    it('should generate a single model', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const expected = await sequelizeHelper.given('customers');
      const result = await performDatabaseAnalysis(databaseConnection);
      expect(result.customers).toStrictEqual(expected.customers);
      await sequelizeHelper.close();
    }, 10000);

    it('should generate a model with a belongsTo association', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const expected = await sequelizeHelper.given('addresses');
      const result = await performDatabaseAnalysis(databaseConnection);
      expect(result.addresses).toStrictEqual(expected.addresses);
      await sequelizeHelper.close();
    }, 10000);

    it('should generate a model with hasOne, hasMany and belongsToMany associations', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const expected = await sequelizeHelper.given('users');
      await sequelizeHelper.dropAndCreate('books');
      await sequelizeHelper.dropAndCreate('addresses');
      await sequelizeHelper.dropAndCreate('reviews');
      await sequelizeHelper.dropAndCreate('user_books');
      const result = await performDatabaseAnalysis(databaseConnection);
      expect(result.users).toStrictEqual(expected.users);
      await sequelizeHelper.close();
    }, 10000);

    it('should handle conflicts between regular field names and references alias', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('cars');
      const expected = await sequelizeHelper.given('rentals');
      const result = await performDatabaseAnalysis(databaseConnection);
      expect(result.rentals).toStrictEqual(expected.rentals);
      await sequelizeHelper.close();
    }, 10000);
  });
});
