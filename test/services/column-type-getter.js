const { expect } = require('chai');
const ColumnTypeGetter = require('../../services/column-type-getter');
const SequelizeHelper = require('../utils/sequelize-helper');

describe('Services > Column Type Getter', () => {
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

  describe('Using mysql', () => {
    const mysqlDatabase = databases.filter((db) => db.dialect === 'mysql')[0];
    let sequelizeHelper;
    let databaseConnection;

    before(async () => {
      sequelizeHelper = new SequelizeHelper();
      databaseConnection = await sequelizeHelper.connect(mysqlDatabase.connectionUrl);
      await sequelizeHelper.given('customers');
    });

    after(async () => {
      databaseConnection = null;
      sequelizeHelper.drop('customers', 'mysql');
      await sequelizeHelper.close();
    });

    it('should handle BIT(1) as boolean type', async () => {
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, '');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).to.eql('BOOLEAN');
    });
  });

  describe('Using pgsql', () => {
    const mysqlDatabase = databases.filter((db) => db.dialect === 'postgres')[0];
    let sequelizeHelper;
    let databaseConnection;

    before(async () => {
      sequelizeHelper = new SequelizeHelper();
      databaseConnection = await sequelizeHelper.connect(mysqlDatabase.connectionUrl);
      await sequelizeHelper.given('customers');
    });

    after(async () => {
      databaseConnection = null;
      sequelizeHelper.drop('customers', 'postgres');
      await sequelizeHelper.close();
    });

    it('should not handle BIT(1)', async () => {
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, '');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).to.eql(null);
    });
  });
});
