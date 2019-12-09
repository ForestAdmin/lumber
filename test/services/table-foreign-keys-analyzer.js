const { expect } = require('chai');
const SequelizeHelper = require('../utils/sequelize-helper');
const { describeSQLDatabases } = require('../utils/multiple-database-version-helper');
const TableForeignKeysAnalyzer = require('../../services/table-foreign-keys-analyzer');
const expectedData = require('../expected/table-foreign-keys-analyzer-output');

describe('Table foreign keys analyzer > SQL', () => {
  describeSQLDatabases(({ connectionUrl, dialect }) => () => {
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

    it('should provide the constraints of a table', async () => {
      const tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, 'public');
      const constraints = await tableForeignKeysAnalyzer.perform('addresses');

      expect(constraints.sort()).is.deep.equals(expectedData[dialect].sort());
    });
  });
});
