const _ = require('lodash');
const SequelizeHelper = require('../../test-utils/sequelize-helper');
const { describeSequelizeDatabases } = require('../../test-utils/multiple-database-version-helper');
const TableConstraintsGetter = require('../../services/analyzer/sequelize-table-constraints-getter');
const expectedAddressesConstraints = require('../../test-expected/sequelize/constraints-getter-output/addresses.expected.js');
const expectedCustomersConstraints = require('../../test-expected/sequelize/constraints-getter-output/customers.expected.js');
const expectedReviewsConstraints = require('../../test-expected/sequelize/constraints-getter-output/reviews.expected.js');

async function createConnection(connectionUrl) {
  const sequelizeHelper = new SequelizeHelper();
  const databaseConnection = await sequelizeHelper.connect(connectionUrl);
  await sequelizeHelper.dropAndCreate('users');
  await sequelizeHelper.dropAndCreate('books');
  await sequelizeHelper.dropAndCreate('customers');
  await sequelizeHelper.dropAndCreate('addresses');
  await sequelizeHelper.dropAndCreate('reviews');
  return { databaseConnection, sequelizeHelper };
}

async function cleanConnection(sequelizeHelper) {
  return sequelizeHelper.close();
}

describe('services > sequelize table constraints getter', () => {
  describeSequelizeDatabases(({ connectionUrl, dialect, schema }) => () => {
    it('should provide the constraints of a table with one unique constraint', async () => {
      expect.assertions(1);
      const { databaseConnection, sequelizeHelper } = await createConnection(connectionUrl);
      const tableConstraintsGetter = new TableConstraintsGetter(databaseConnection, schema);
      const constraints = await tableConstraintsGetter.perform('addresses');

      expect(_.sortBy(constraints, ['constraintName'])).toStrictEqual(
        _.sortBy(expectedAddressesConstraints[dialect], ['constraintName']),
      );
      await cleanConnection(sequelizeHelper);
    });

    it('should provide the constraints of a table without any unique constraint', async () => {
      expect.assertions(1);
      const { databaseConnection, sequelizeHelper } = await createConnection(connectionUrl);
      const tableConstraintsGetter = new TableConstraintsGetter(databaseConnection, schema);
      const constraints = await tableConstraintsGetter.perform('customers');

      expect(_.sortBy(constraints, ['constraintName'])).toStrictEqual(
        _.sortBy(expectedCustomersConstraints[dialect], ['constraintName']),
      );
      await cleanConnection(sequelizeHelper);
    });

    it('should provide the constraints of a table with a composite unique constraint', async () => {
      expect.assertions(3);
      const { databaseConnection, sequelizeHelper } = await createConnection(connectionUrl);
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
      expect(uniqueIndexesList).toHaveLength(expectedUniqueIndexes.length);
      uniqueIndexesList.forEach((uniqueIndex, index) =>
        expect(uniqueIndex.sort()).toStrictEqual(expectedUniqueIndexes[index].sort()));

      // NOTICE: Compare the other objects
      expect(
        sortedConstraints.map(({ uniqueIndexes, ...otherFields }) => otherFields),
      ).toStrictEqual(
        expectedSortedConstraints.map(({ uniqueIndexes, ...otherFields }) => otherFields),
      );
      await cleanConnection(sequelizeHelper);
    });
  });
});
