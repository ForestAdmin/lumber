/* global describe, before, beforeEach, after, it */
const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../utils/sequelize-helper');
const DatabaseAnalyzer = require('../../services/database-analyzer');
const singleModel = require('../fixtures/sequelize/single-model');
const expectedSingleModel = require('../expected/single-model.js');

describe('Database analyser > Sequelize', () => {
  const databases = [
    {
      dialect: 'mysql',
      connectionUrl: 'mysql://forest:secret@localhost:8999/lumber-sequelize-test',
    },
    {
      dialect: 'postgres',
      connectionUrl: 'postgres://forest:secret@localhost:5436/lumber-sequelize-test',
    },
  ];

  databases.forEach((database) => {
    describe(`with ${database.dialect}`, () => {
      let sequelizeHelper;
      let databaseConnection;

      before(async () => {
        sequelizeHelper = new SequelizeHelper();
        databaseConnection = await sequelizeHelper.connect(database.connectionUrl);
      });

      beforeEach(() => sequelizeHelper.dropAllTables());

      after(async () => {
        databaseConnection = null;
        await sequelizeHelper.close();
      });

      it('should connect and create a record.', async () => {
        const User = databaseConnection.define('user', { name: { type: Sequelize.STRING } });
        await User.sync({ force: true });
        const user = await User.create({ name: 'Jane' });
        expect(user.name).to.be.equal('Jane');
      });

      it('should generate a single model', async () => {
        await sequelizeHelper.given(singleModel);
        const databaseAnalyzer = new DatabaseAnalyzer(
          databaseConnection,
          { dbDialect: database.dialect },
        );
        const model = await databaseAnalyzer.perform();
        expect(model).is.deep.equal(expectedSingleModel(database.dialect));
      });

      it('should not create a reference if multiples referenced collections are found', async () => expect(true).to.be.true);

      it('should find the reference even in a db with many nulls', async () => expect(true).to.be.true);

      it('should generate the model with many objectid fields', async () => expect(true).to.be.true);
    });
  });
});
