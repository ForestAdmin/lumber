const { expect } = require('chai');
const SequelizeHelper = require('../utils/sequelize-helper');
const { databases } = require('../utils/databases-urls');
const TableForeignKeysAnalyzer = require('../../services/table-foreign-keys-analyzer');
const expectedData = require('../expected/table-foreign-keys-analyzer-output');

describe('Table analyser > SQL', () => {
  databases.forEach(({ connectionUrl, dialect }) => {
    describe(`with ${dialect}`, () => {
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

        expect(constraints).is.deep.equal(expectedData[dialect]);
      });
    });
  });
});
