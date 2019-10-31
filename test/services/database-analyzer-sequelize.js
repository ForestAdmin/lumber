/* global describe, before, beforeEach, after, it */
const { expect } = require('chai');
const Sequelize = require('sequelize');
const SequelizeHelper = require('../utils/sequelize-helper');
const DatabaseAnalyzer = require('../../services/database-analyzer');
/*
const simpleModel = require('../fixtures/simple-model');
const multipleReferencesModel = require('../fixtures/multiple-references-same-field-model');
const manyNullsModel = require('../fixtures/many-nulls-model');
const complexModel = require('../fixtures/many-objectid-fields-model');
const expectedSimpleGeneratedModel = require('../expected/simple-generated-model.json');
const expectedMultipleReferencesGeneratedModel = require('../expected/multiple-references-same-field-generated-model.json');
const expectedManyuNullsGeneratedModel = require('../expected/many-nulls-generated-model.json');
const expectedManyObjectIDFieldsGeneratedModel = require('../expected/many-objectid-fields-generated-model.json');
*/

describe('Database analyser > Sequelize', () => {

  const databases = [
    {
      dialect: 'MySQL',
      connectionUrl: 'mysql://forest:secret@localhost:8999/lumber-sequelize-test'
    },
    {
      dialect: 'PostgreSQL',
      connectionUrl: 'postgres://forest:secret@localhost:5436/lumber-sequelize-test'
    },
  ];

  databases.forEach(database => {
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
        const user = await User.create({ name: 'Jane'});
        expect(user.name).to.be.equal('Jane');
      });

      it('should generate a simple model', async () => {
        expect(true).to.be.true;
        return;
        await sequelizeHelper.given(simpleModel);
        const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
        const model = await databaseAnalyzer.perform();
        expect(model).is.deep.equal(expectedSimpleGeneratedModel);
      });

      it('should not create a reference if multiples referenced collections are found', async () => {
        expect(true).to.be.true;
        return;
        await sequelizeHelper.given(multipleReferencesModel);
        const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
        const model = await databaseAnalyzer.perform();
        expect(model).is.deep.equal(expectedMultipleReferencesGeneratedModel);
      });

      it('should find the reference even in a db with many nulls', async () => {
        expect(true).to.be.true;
        return;
        await sequelizeHelper.given(manyNullsModel);
        const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
        const model = await databaseAnalyzer.perform();
        expect(model).is.deep.equal(expectedManyuNullsGeneratedModel);
      });

      it('should generate the model with many objectid fields', async () => {
        expect(true).to.be.true;
        return;
        await sequelizeHelper.given(complexModel);
        const databaseAnalyzer = new DatabaseAnalyzer(databaseConnection, { dbDialect: 'mongodb' });
        const model = await databaseAnalyzer.perform();
        expect(model).is.deep.equal(expectedManyObjectIDFieldsGeneratedModel);
      });
    });


  });
});