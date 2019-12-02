const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../../utils/sequelize-helper');
const DatabaseAnalyzer = require('../../../services/database-analyzer');
const { describeSqlDatabases } = require('../../utils/multiple-database-version-helper');

describe('Database analyser > Sequelize', () => {
  describeSqlDatabases((sqlUrl, dbDialect) => () => {
    let sequelizeHelper;
    let databaseConnection;

    before(async () => {
      sequelizeHelper = new SequelizeHelper();
      databaseConnection = await sequelizeHelper.connect(sqlUrl);
    });

    after(async () => {
      databaseConnection = null;
      await sequelizeHelper.close();
    });

    // NOTICE: Use .timeout() to avoid error with mssql.

    it('should connect and create a record', async () => {
      const User = databaseConnection.define('user', { name: { type: Sequelize.STRING } });
      await sequelizeHelper.forceSync(User);
      const user = await User.create({ name: 'Jane' });
      expect(user.name).to.be.equal('Jane');
    }).timeout(5000);

    it('should generate a model with a belongsTo association', async () => {
      await sequelizeHelper.given('users', 'others');
      const expectedModel = await sequelizeHelper.given('addresses', 'belongs-to');
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, dbDialect);
      const model = await databaseAnalyzer.perform();
      expect(model.addresses).is.deep.equal(expectedModel.addresses);
    }).timeout(5000);

    it('should generate a model with hasOne, hasMany and belongsToMany associations', async () => {
      const expectedModel = await sequelizeHelper.given('users', 'others');
      await sequelizeHelper.given('books', 'others');
      await sequelizeHelper.given('addresses', 'others');
      await sequelizeHelper.given('reviews', 'others');
      await sequelizeHelper.given('user_books', 'others');
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, dbDialect);
      const model = await databaseAnalyzer.perform();
      expect(model.users).is.deep.equal(expectedModel.users);
    }).timeout(5000);
  });
});
