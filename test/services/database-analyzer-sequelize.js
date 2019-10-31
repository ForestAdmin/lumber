/* global describe, before, afterEach, after, it */
const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../utils/sequelize-helper');
const DatabaseAnalyzer = require('../../services/database-analyzer');
const SingleModel = require('../fixtures/sequelize/single-model');
const expectedSingleModel = require('../expected/single-model');
const ModelsWithRelation = require('../fixtures/sequelize/models-with-relations');
const expectedModelsWithRelation = require('../expected/models-with-relations');

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

  function performDatabaseAnalysis(connection, dialect) {
    const databaseAnalyzer = new DatabaseAnalyzer(connection, { dbDialect: dialect });
    return databaseAnalyzer.perform();
  }

  databases.forEach(({ connectionUrl, dialect }) => {
    describe(`with ${dialect}`, () => {
      let sequelizeHelper;
      let databaseConnection;

      before(async () => {
        sequelizeHelper = new SequelizeHelper();
        databaseConnection = await sequelizeHelper.connect(connectionUrl);
      });

      afterEach(() => sequelizeHelper.dropAllTables());

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
        const singleModel = new SingleModel(databaseConnection);
        await singleModel.build();
        const result = await performDatabaseAnalysis(databaseConnection, dialect);
        expect(result.users).is.deep.equal(expectedSingleModel(dialect).users);
      });

      it('should generate models with relations', async () => {
        const modelsWithRelation = new ModelsWithRelation(databaseConnection);
        await modelsWithRelation.build();
        const result = await performDatabaseAnalysis(databaseConnection, dialect);
        const expected = expectedModelsWithRelation(dialect);
        expect(result.books).is.deep.equal(expected.books);
        expect(result.authors).is.deep.equal(expected.authors);
      });
    });
  });
});
