const P = require('bluebird');
const chalk = require('chalk');
const DB = require('../services/db');
const TableAnalyzer = require('../services/table-analyzer');
const Migrator = require('../services/migrator');

async function update(config) {
  if ((config.dbConnectionUrl && config.dbConnectionUrl.startsWith('mongodb')) || config.dbDialect === 'mongodb') {
    throw new Error('💀  The lumber update command is not yet supported on MongoDB. 💀');
  }

  const db = await new DB().connect(config);
  const schema = await new TableAnalyzer(db, config).perform();
  const migrator = new Migrator(config);

  // Detect new tables.
  const newTables = await migrator.detectNewTables(schema);
  await P.mapSeries(newTables, async (table) => {
    console.log(`New table detected: ${chalk.green(table)}`);
    const modelPath = await migrator.createModel(schema, table);
    console.log(`   ${chalk.green('✔')} Model created: ${chalk.green(modelPath)}`);
  });

  // Detect new fields.
  const newFields = await migrator.detectNewFields(schema);
  await P.mapSeries(Object.keys(newFields), async (table) => {
    await P.mapSeries(newFields[table], async (field) => {
      console.log(`New field detected: ${field.name}`);
      const modelPath = await migrator.createField(table, field);
      console.log(`   ${chalk.green('✔')} Field added: ${chalk.green(modelPath)}`);
    });
  });
}

module.exports = update;
