const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../../utils/sequelize-helper');
const DatabaseAnalyzer = require('../../../services/database-analyzer');
const TableForeignKeysAnalyzer = require('../../../services/table-foreign-keys-analyzer');

describe('Database analyser > Sequelize', () => {
  const databases = [
    {
      dialect: 'mysql',
      connectionUrl: 'mysql://forest:secret@localhost:8999/lumber-sequelize-test',
    },
    {
      dialect: 'postgres',
      connectionUrl: 'postgres://forest:secret@localhost:54369/lumber-sequelize-test',
    },
  ];

  function performDatabaseAnalysis(connection, dialect) {
    const databaseAnalyzer = new DatabaseAnalyzer(connection, { dbDialect: dialect });
    return databaseAnalyzer.perform('customers');
  }

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

      it('should give us constraint_name, table_name_ column_type, column_name, foreign_table_name, foreign_column_name, unique_indexes', async () => {
        const tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, 'public');
        const constraints = await tableForeignKeysAnalyzer.perform('addresses');

        if (dialect === 'postgres') {
          expect(Object.keys(constraints[0]).sort()).to.eql([
            'constraint_name',
            'table_name',
            'column_type',
            'column_name',
            'foreign_table_name',
            'foreign_column_name',
            'unique_indexes',
          ].sort());
        } else {
          expect(Object.keys(constraints[0]).sort()).to.eql([
            'constraint_name',
            'table_name',
            'column_name',
            'foreign_table_name',
            'foreign_column_name',
          ].sort());
        }
      });

      it('should connect and create a record.', async () => {
        const User = databaseConnection.define('user', { name: { type: Sequelize.STRING } });
        await User.sync({ force: true });
        const user = await User.create({ name: 'Jane' });
        expect(user.name).to.be.equal('Jane');
      });

      it('should generate a single model', async () => {
        const expected = await sequelizeHelper.given('customers');
        const result = await performDatabaseAnalysis(databaseConnection);
        expect(result.customers).is.deep.equal(expected);
      });

      it('should generate two models with relationship', async () => {
        await sequelizeHelper.given('customers');
        const expected = await sequelizeHelper.given('addresses');
        const result = await performDatabaseAnalysis(databaseConnection);
        expect(result.addresses).is.deep.equal(expected);
      });
    });
  });
});
