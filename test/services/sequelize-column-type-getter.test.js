const ColumnTypeGetter = require('../../services/analyzer/sequelize-column-type-getter');
const SequelizeHelper = require('../utils/sequelize-helper');
const { DATABASE_URL_MYSQL, DATABASE_URL_POSTGRESQL } = require('../utils/database-urls');

describe('services > column type getter', () => {
  describe('using mysql', () => {
    it('should handle BIT(1) as boolean type', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(DATABASE_URL_MYSQL);
      await sequelizeHelper.dropAndCreate('customers');
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, '');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).toStrictEqual('BOOLEAN');

      // databaseConnection = null;
      await sequelizeHelper.drop('customers', 'mysql');
      await sequelizeHelper.close();
    });
  });

  describe('using postgresql', () => {
    it('should not handle BIT(1)', async () => {
      expect.assertions(1);
      const sequelizeHelper = new SequelizeHelper();
      const databaseConnection = await sequelizeHelper.connect(DATABASE_URL_POSTGRESQL);
      await sequelizeHelper.dropAndCreate('customers');
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, '');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).toBeNull();

      // databaseConnection = null;
      await sequelizeHelper.drop('customers', 'postgres');
      await sequelizeHelper.close();
    });
  });
});
