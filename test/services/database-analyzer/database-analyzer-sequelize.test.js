const Sequelize = require('sequelize');
const SequelizeHelper = require('../../../test-utils/sequelize-helper');
const { describeSequelizeDatabases } = require('../../../test-utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/analyzer/database-analyzer');

const TIMEOUT = 30000;

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
      await sequelizeHelper.close();
      expect(user.name).toStrictEqual('Jane');
    });

    it('should generate a single model', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const expected = await sequelizeHelper.given('customers');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.customers).toStrictEqual(expected.customers);
    }, TIMEOUT);

    it('should generate a model with a belongsTo association', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const expected = await sequelizeHelper.given('addresses');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.addresses).toStrictEqual(expected.addresses);
    }, TIMEOUT);

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
      await sequelizeHelper.close();
      expect(result.users).toStrictEqual(expected.users);
    }, TIMEOUT);

    it('should handle conflicts between regular field names and references alias', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('cars');
      const expected = await sequelizeHelper.given('rentals');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.rentals).toStrictEqual(expected.rentals);
    }, TIMEOUT);

    it('should remove identic references', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('cars');
      const expected = await sequelizeHelper.given('doubleref');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.doubleref.references).toHaveLength(expected.doubleref.referencesLength);
    }, TIMEOUT);

    it('should detect snake_case even with no fields in the table', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('sample_table');
      await sequelizeHelper.dropAndCreate('underscored_no_fields');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.underscored_no_fields.options.underscored).toStrictEqual(true);
    }, TIMEOUT);

    it('should handle conflicts between references alias', async () => {
      expect.assertions(3);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const expected = await sequelizeHelper.given('duplicatedalias');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();

      const projectReferences = new Set(result.project.references.map(({ as }) => as));
      expect(projectReferences.size).toBe(expected.project.referencesLength);

      const joinrolesReferences = new Set(result.joinroles.references.map(({ as }) => as));
      expect(joinrolesReferences.size).toBe(expected.joinroles.referencesLength);

      const rolesReferences = new Set(result.roles.references.map(({ as }) => as));
      expect(rolesReferences.size).toBe(expected.roles.referencesLength);
    }, TIMEOUT);
  });
});
