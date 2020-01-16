const ColumnTypeGetter = require('../../services/analyzer/sequelize-column-type-getter');
const SequelizeHelper = require('../../test-utils/sequelize-helper');
const { DATABASE_URL_MYSQL_MAX, DATABASE_URL_POSTGRESQL_MAX } = require('../../test-utils/database-urls');

describe('services > column type getter', () => {
  describe('using mysql', () => {
    it('should handle BIT(1) as boolean type', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(DATABASE_URL_MYSQL_MAX);
      await sequelizeHelper.dropAndCreate('customers');
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, '');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).toStrictEqual('BOOLEAN');

      await sequelizeHelper.drop('customers', 'mysql');
      await sequelizeHelper.close();
    });
  });

  describe('using postgresql', () => {
    it('should not handle BIT(1)', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(DATABASE_URL_POSTGRESQL_MAX);
      await sequelizeHelper.dropAndCreate('customers');
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, 'public');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).toBeNull();

      await sequelizeHelper.drop('customers', 'postgres');
      await sequelizeHelper.close();
    });

    it('should handle `integer ARRAY` as `ARRAY(DataTypes.INTEGER)`', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(DATABASE_URL_POSTGRESQL_MAX);
      await sequelizeHelper.dropAndCreate('employees');
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, 'public');
      const computedType = await columnTypeGetter.perform({ type: 'ARRAY' }, 'pay_by_quarter', 'employees');

      expect(computedType).toStrictEqual('ARRAY(DataTypes.INTEGER)');

      await sequelizeHelper.drop('employees', 'postgres');
      await sequelizeHelper.close();
    });
  });
});
