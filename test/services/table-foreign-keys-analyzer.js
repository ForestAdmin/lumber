const { expect } = require('chai');
const SequelizeHelper = require('../utils/sequelize-helper');
const { databases } = require('../utils/databases-urls');
const TableForeignKeysAnalyzer = require('../../services/table-foreign-keys-analyzer');

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
        const expectedConstraints = {
          postgres: [
            'constraint_name',
            'table_name',
            'column_type',
            'column_name',
            'foreign_table_name',
            'foreign_column_name',
            'unique_indexes',
          ].sort(),
          mysql: [
            'constraint_name',
            'table_name',
            'column_name',
            'foreign_table_name',
            'foreign_column_name',
          ],
          mssql: [
            'constraint_name',
            'table_name',
            'column_name',
            'foreign_table_name',
            'foreign_column_name',
          ],
        };

        constraints.forEach((constraint) =>
          expect(Object.keys(constraint).sort()).to.eql(expectedConstraints[dialect].sort()));
      });
    });
  });
});
