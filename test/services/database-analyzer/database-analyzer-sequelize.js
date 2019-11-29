const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../../utils/sequelize-helper');
const DatabaseAnalyzer = require('../../../services/database-analyzer');
const { describeSqlDatabases } = require('../../utils/multiple-database-version-helper');

describe('Database analyser > Sequelize', () => {
  // function performDatabaseAnalysis(connection, dialect) {
  //   const databaseAnalyzer = new DatabaseAnalyzer(connection, { dbDialect: dialect });
  //   return databaseAnalyzer.perform();
  // }

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

    it('should connect and create a record', async () => {
      const User = databaseConnection.define('user', { name: { type: Sequelize.STRING } });
      await sequelizeHelper.forceSync(User);
      const user = await User.create({ name: 'Jane' });
      expect(user.name).to.be.equal('Jane');
    });

    it('should generate a model with a belongsTo association', async () => {
      const expectedBelongsToModel = await sequelizeHelper.given('addresses');
      const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, dbDialect);
      const model = await databaseAnalyzer.perform();
      expect(model).is.deep.equal(expectedBelongsToModel);
    });

    // it('should generate a model with hasmany', async () => {
    //   await sequelizeHelper.given(hasManyModel);
    // const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
    //   const model = await databaseAnalyzer.perform();
    //   expect(model).is.deep.equal(expectedHasManyModel);
    // });

    // it('should not create a reference collections are found', async () => {
    //   await sequelizeHelper.given(multipleReferencesModel);
    // const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
    //   const model = await databaseAnalyzer.perform();
    //   expect(model).is.deep.equal(expectedMultipleReferencesModel);
    // });

    // it('should find the reference even in a db with many nulls', async () => {
    //   await sequelizeHelper.given(manyNullsModel);
    // const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
    //   const model = await databaseAnalyzer.perform();
    //   expect(model).is.deep.equal(expectedManyuNullsModel);
    // });

    // it('should generate the model with many objectid fields', async () => {
    //   await sequelizeHelper.given(complexModel);
    // const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
    //   const model = await databaseAnalyzer.perform();
    //   expect(model).is.deep.equal(expectedManyObjectIDFieldsModel);
    // });
  });
});
