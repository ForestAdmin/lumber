const _ = require('lodash');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../../../test-utils/sequelize-helper');
const { describeSequelizeDatabases } = require('../../../test-utils/multiple-database-version-helper');
const DatabaseAnalyzer = require('../../../services/analyzer/database-analyzer');
const databaseUrls = require('../../../test-utils/database-urls');
const expectedDefaultValuesPostgres = require('../../../test-expected/sequelize/db-analysis-output/default_values.postgres.expected');
const expectedDefaultValuesMysql = require('../../../test-expected/sequelize/db-analysis-output/default_values.mysql.expected');
const expectedDefaultValuesMssql = require('../../../test-expected/sequelize/db-analysis-output/default_values.mssql.expected');

const TIMEOUT = 30000;

// For convenience when writing the tests, index analyzer output by connectionUrl
const defaultsValueExpected = {
  [databaseUrls.DATABASE_URL_POSTGRESQL_MIN]: _.cloneDeep(expectedDefaultValuesPostgres),
  [databaseUrls.DATABASE_URL_POSTGRESQL_MAX]: expectedDefaultValuesPostgres,
  [databaseUrls.DATABASE_URL_MYSQL_MAX]: expectedDefaultValuesMysql,
  [databaseUrls.DATABASE_URL_MSSQL_MIN]: expectedDefaultValuesMssql,
  [databaseUrls.DATABASE_URL_MSSQL_MAX]: expectedDefaultValuesMssql,
};

// Expected output for PostgresMin and PostgresMax differ only by one value.
// CURRENT_TIMESTAMP() is an alias of NOW() in Postgres 9, but not anymore in up-to-date versions.
// => patch the difference here, instead of duplicating the file.
defaultsValueExpected[databaseUrls.DATABASE_URL_POSTGRESQL_MIN]
  .default_values
  .fields[9].defaultValue.val = 'now()';

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

    it('should generate a model with default values', async () => {
      expect.assertions(1);

      // eslint-disable-next-line jest/no-if
      if (defaultsValueExpected[connectionUrl]) {
        const sequelizeHelper = new SequelizeHelper();
        const databaseConnection = await sequelizeHelper.connect(connectionUrl);

        const expected = defaultsValueExpected[connectionUrl];
        await sequelizeHelper.dropAndCreate('default_values');
        const result = await performDatabaseAnalysis(databaseConnection);
        await sequelizeHelper.close();

        expect(result.default_values).toStrictEqual(expected.default_values);
      } else {
        expect(true).toStrictEqual(true);
      }
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

    it('should generate a model with a belongsTo association and sourceKey/targetKey', async () => {
      expect.assertions(2);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      const expectedOwners = await sequelizeHelper.given('owners');
      const expectedProjects = await sequelizeHelper.given('projects');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.owners).toStrictEqual(expectedOwners.owners);
      expect(result.projects).toStrictEqual(expectedProjects.projects);
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

    it('should not set underscored to true if parenthesis in column name', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('parenthesis_table');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.parenthesis_table.options.underscored).toStrictEqual(false);
    }, TIMEOUT);

    it('should not set underscored to true if parenthesis in column name and underscored field', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('parenthesis_underscored_table');
      const result = await performDatabaseAnalysis(databaseConnection);
      await sequelizeHelper.close();
      expect(result.parenthesis_underscored_table.options.underscored).toStrictEqual(false);
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

    it('should handle id column if present on table having only foreign keys', async () => {
      expect.assertions(4);

      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('only_foreign_keys_and_id');
      const result = await performDatabaseAnalysis(databaseConnection);

      await sequelizeHelper.close();

      expect(result.only_foreign_keys_and_id.references).toHaveLength(2);

      const { fields } = result.only_foreign_keys_and_id;
      expect(fields).toHaveLength(1);

      const idField = fields[0];
      expect(idField.name).toStrictEqual('id');
      expect(idField.primaryKey).toStrictEqual(true);
    }, TIMEOUT);
  });
});
