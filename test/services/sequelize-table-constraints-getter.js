const { expect } = require('chai');
const _ = require('lodash');
const SequelizeHelper = require('../utils/sequelize-helper');
const { describeSequelizeDatabases } = require('../utils/multiple-database-version-helper');
const TableConstraintsGetter = require('../../services/analyzer/sequelize-table-constraints-getter');
const expectedAddressesConstraints = require('../expected/sequelize/constraints-getter-output/addresses.js.expected');
const expectedCustomersConstraints = require('../expected/sequelize/constraints-getter-output/customers.js.expected');

describe('Services > Sequelize Table Constraints Getter', () => {
  describeSequelizeDatabases(({ connectionUrl, dialect, schema }) => () => {
    let sequelizeHelper;
    let databaseConnection;

    before(async () => {
      sequelizeHelper = new SequelizeHelper();
      databaseConnection = await sequelizeHelper.connect(connectionUrl);
      await sequelizeHelper.dropAndCreate('customers');
      await sequelizeHelper.dropAndCreate('addresses');
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
  });
});
