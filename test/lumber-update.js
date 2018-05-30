const fs = require('fs');
const ava = require('ava');
const expect = require('chai').expect;
const Migrator = require('../services/migrator');

const config = {
  dbDialect: 'sqlite',
  dbStorage: 'test/sample-project/chinook.sqlite',
  serverHost: 'https://forestadmin-server.herokuapp.com',
  sourceDirectory: 'test/sample-project'
};

ava.test('Detect new tables', async t => {
  const migrator = new Migrator(config);
  const schema = {
    albums: { fields: [], references: [] },
    customers: { fields: [], references: [] },
    foo: { fields: [], references: [] },
    bar: { fields: [], references: [] },
  };

  const newTables = await migrator.detectNewTables(schema);
  expect(newTables).to.be.an('array').eql(['foo', 'bar']);

  t.pass();
});

ava.test('Detect new fields', async t => {
  const migrator = new Migrator(config);
  const schema = {
    albums: {
      fields: [{
        name: 'AlbumId',
        type: 'INTEGER',
        primaryKey: true,
      }, {
        name: 'Title',
        type: 'STRING',
      }, {
        name: 'ArtistId',
        type: 'INTEGER',
      }],
      references: []
    },
    customers: {
      fields: [{
        name: 'FirstName',
        type: 'STRING',
      }, {
        name: 'LastName',
        type: 'STRING',
      }]
    }
  };

  const modelPath = __dirname + '/sample-project/models/albums.js';
  const field = { name: 'AlbumId', primaryKey: true };
  const regexp = new RegExp(`\\s*'${field.name}':\\s*{\\s*type:\\s*DataTypes..*[^}]*},?`);

  let originalContent = fs.readFileSync(modelPath, 'utf-8');
  let newContent;

  if (originalContent.match(regexp)) {
    newContent = originalContent.replace(regexp, '');
    fs.writeFileSync(modelPath, newContent);
  }

  const newFields = await migrator.detectNewFields(schema);
  expect(newFields).to.be.eql({
    albums: [ { name: 'AlbumId', type: 'INTEGER', primaryKey: true } ],
    customers: []
  });

  fs.writeFileSync(modelPath, originalContent);

  t.pass();
});
