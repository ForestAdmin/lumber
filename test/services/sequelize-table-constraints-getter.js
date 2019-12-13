const { expect } = require('chai');
const _ = require('lodash');
const SequelizeHelper = require('../utils/sequelize-helper');
const { describeSequelizeDatabases } = require('../utils/multiple-database-version-helper');
const TableConstraintsGetter = require('../../services/analyzer/sequelize-table-constraints-getter');
const expectedAddressesConstraints = require('../expected/sequelize/constraints-getter-output/addresses.js.expected');
const expectedCustomersConstraints = require('../expected/sequelize/constraints-getter-output/customers.js.expected');
const expectedReviewsConstraints = require('../expected/sequelize/constraints-getter-output/reviews.js.expected');

describe('Services > Sequelize Table Constraints Getter', () => {
  describeSequelizeDatabases(({ connectionUrl, dialect, schema }) => () => {
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
      const tableConstraintsGetter = new TableConstraintsGetter(databaseConnection, schema);
      const constraints = await tableConstraintsGetter.perform('addresses');

      expect(_.sortBy(constraints, ['constraintName'])).deep.equals(
        _.sortBy(expectedAddressesConstraints[dialect], ['constraintName']),
      );
    });

    it('should provide the constraints of a table without any unique constraint', async () => {
      const tableConstraintsGetter = new TableConstraintsGetter(databaseConnection, schema);
      const constraints = await tableConstraintsGetter.perform('customers');

      expect(_.sortBy(constraints, ['constraintName'])).deep.equals(
        _.sortBy(expectedCustomersConstraints[dialect], ['constraintName']),
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
      const tableConstraintsGetter = new TableConstraintsGetter(databaseConnection, schema);
      const constraints = await tableConstraintsGetter.perform('reviews');
      const sortedConstraints = _.sortBy(constraints, sortingFields);
      const expectedSortedConstraints = _.sortBy(
        expectedReviewsConstraints[dialect],
        sortingFields,
      );

      // NOTICE: Get an array of unique indexes for the table (MySQL doesn't order json aggregates)
      function extractUniqueIndexes(constraintsToExtract) {
        return _.compact(_.flatten(_.uniqWith(
          constraintsToExtract.map((constraint) => constraint.uniqueIndexes),
          _.isEqual,
        )));
      }

      const uniqueIndexesList = extractUniqueIndexes(sortedConstraints);
      const expectedUniqueIndexes = extractUniqueIndexes(expectedSortedConstraints);

      // NOTICE: Compare the lists of unique indexes
      expect(uniqueIndexesList.length).equals(expectedUniqueIndexes.length);
      uniqueIndexesList.forEach((uniqueIndex, index) =>
        expect(uniqueIndex.sort()).deep.equals(expectedUniqueIndexes[index].sort()));

      // NOTICE: Compare the other objects
      expect(
        sortedConstraints.map(({ uniqueIndexes, ...otherFields }) => otherFields),
      ).deep.equals(
        expectedSortedConstraints.map(({ uniqueIndexes, ...otherFields }) => otherFields),
      );
    });
  });
});
