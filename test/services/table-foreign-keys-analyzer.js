const { expect } = require('chai');
const { sortBy } = require('lodash');
const SequelizeHelper = require('../utils/sequelize-helper');
const { describeSQLDatabases } = require('../utils/multiple-database-version-helper');
const TableForeignKeysAnalyzer = require('../../services/table-foreign-keys-analyzer');
const expectedAddressesConstraints = require('../expected/sql/foreign-keys-analysis-output/addresses');
const expectedCustomersConstraints = require('../expected/sql/foreign-keys-analysis-output/customers');
const expectedReviewsConstraints = require('../expected/sql/foreign-keys-analysis-output/reviews');

describe('Table foreign keys analyzer > SQL', () => {
  describeSQLDatabases(({ connectionUrl, dialect }) => () => {
    let sequelizeHelper;
    let databaseConnection;

    before(async () => {
      sequelizeHelper = new SequelizeHelper();
      databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('users');
      await sequelizeHelper.dropAndCreate('books');
      await sequelizeHelper.dropAndCreate('customers');
      await sequelizeHelper.dropAndCreate('addresses');
      await sequelizeHelper.dropAndCreate('reviews');
    });

    after(async () => {
      databaseConnection = null;
      await sequelizeHelper.close();
    });

    it('should provide the constraints of a table with one unique constraint', async () => {
      const tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, 'public');
      const constraints = await tableForeignKeysAnalyzer.perform('addresses');

      expect(sortBy(constraints, ['constraintName'])).is.deep.equals(
        sortBy(expectedAddressesConstraints[dialect], ['constraintName']),
      );
    });

    it('should provide the constraints of a table without any unique constraint', async () => {
      const tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, 'public');
      const constraints = await tableForeignKeysAnalyzer.perform('customers');

      expect(sortBy(constraints, ['constraintName'])).is.deep.equals(
        sortBy(expectedCustomersConstraints[dialect], ['constraintName']),
      );
    });

    it('should provide the constraints of a table with a composite unique constraint', async () => {
      const tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, 'public');
      const constraints = await tableForeignKeysAnalyzer.perform('reviews');
      const sortingFields = [
        'constraintName',
        'tableName',
        'columnType',
        'columnName',
        'foreignTableName',
        'foreignColumnName',
      ];

      expect(sortBy(constraints, sortingFields)).is.deep.equals(
        sortBy(expectedReviewsConstraints[dialect], sortingFields),
      );
    });
  });
});
