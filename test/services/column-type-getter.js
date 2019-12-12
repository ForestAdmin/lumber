const { expect } = require('chai');
const ColumnTypeGetter = require('../../services/column-type-getter');
const SequelizeHelper = require('../utils/sequelize-helper');
const { DATABASE_URL_MYSQL, DATABASE_URL_POSTGRESQL } = require('../utils/database-urls');

describe('Services > Column Type Getter', () => {
  describe('Using mysql', () => {
    let sequelizeHelper;
    let databaseConnection;

    before(async () => {
      sequelizeHelper = new SequelizeHelper();
      databaseConnection = await sequelizeHelper.connect(DATABASE_URL_MYSQL);
      await sequelizeHelper.dropAndCreate('customers');
    });

    after(async () => {
      databaseConnection = null;
      await sequelizeHelper.drop('customers', 'mysql');
      await sequelizeHelper.close();
    });

    it('should handle BIT(1) as boolean type', async () => {
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, '');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).to.eql('BOOLEAN');
    });
  });

  describe('Using postgresql', () => {
    let sequelizeHelper;
    let databaseConnection;

    before(async () => {
      sequelizeHelper = new SequelizeHelper();
      databaseConnection = await sequelizeHelper.connect(DATABASE_URL_POSTGRESQL);
      await sequelizeHelper.dropAndCreate('customers');
    });

    after(async () => {
      databaseConnection = null;
      await sequelizeHelper.drop('customers', 'postgres');
      await sequelizeHelper.close();
    });

    it('should not handle BIT(1)', async () => {
      const columnTypeGetter = new ColumnTypeGetter(databaseConnection, '');
      const computedType = await columnTypeGetter.perform({ type: 'BIT(1)' }, 'paying', 'customers');

      expect(computedType).to.eql(null);
    });
  });
});
