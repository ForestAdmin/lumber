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
      const sortingFields = [
        'constraintName',
        'tableName',
        'columnType',
        'columnName',
        'foreignTableName',
        'foreignColumnName',
      ];
      const tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, 'public');
      const constraints = await tableForeignKeysAnalyzer.perform('reviews');
      const sortedConstraints = sortBy(constraints, sortingFields);
      const expectedSortedConstraints = sortBy(expectedReviewsConstraints[dialect], sortingFields);

      // Get an array of unique indexes for the table (MySQL doesn't order json aggregates)
      const uniqueIndexesList = [...new Set(
        sortedConstraints.map((constraint) => constraint.uniqueIndexes)
          .flat().map((v) => JSON.stringify(v)),
      )].map((v) => JSON.parse(v));

      const expectedUniqueIndexes = [...new Set(
        expectedSortedConstraints
          .map((constraint) => constraint.uniqueIndexes)
          .flat().map((v) => JSON.stringify(v)),
      )].map((v) => JSON.parse(v));

      // Comprare the lists of unique indexes
      expect(uniqueIndexesList.length).is.equals(expectedUniqueIndexes.length);
      uniqueIndexesList.forEach((uniqueIndex, index) =>
        expect(uniqueIndex.sort()).is.deep.equals(expectedUniqueIndexes[index].sort()));

      // Compare the reste of the objects
      expect(
        sortedConstraints
          .map(({ uniqueIndexes, ...otherFields }) => otherFields),
      ).is.deep.equals(
        expectedSortedConstraints
          .map(({ uniqueIndexes, ...otherFields }) => otherFields),
      );
    });
  });
});
