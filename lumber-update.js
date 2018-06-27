const _ = require('lodash');
const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
const DB = require('./services/db');
const TableAnalyzer = require('./services/table-analyzer');
const Migrator = require('./services/migrator');
const Prompter = require('./services/prompter');

program
  .description('Update your models\' definition according to your database schema')
  .option('-c, --connection-url', 'Enter the database credentials with a connection URL')
  .option('-d, --source-directory <sourceDirectory>', 'The directory of your Lumber generated admin')
  .parse(process.argv);

(async () => {
  const config = await Prompter(program, [
    'dbCollectionUrl',
    'dbDialect',
    'dbName',
    'dbSchema',
    'dbHostname',
    'dbPort',
    'dbUser',
    'dbPassword',
    'dbStorage',
  ]);

  const db = await new DB().connect(config);
  const queryInterface = db.getQueryInterface();
  const tableAnalyzer = new TableAnalyzer(queryInterface, config);
  const migrator = new Migrator(config);

  const schema = {};

  // Build the db schema.
  await P.mapSeries(queryInterface.showAllTables({
    schema: config.dbSchema,
  }), async (table) => {
    // NOTICE: MS SQL returns objects instead of strings.
    // eslint-disable-next-line no-param-reassign
    if (typeof table === 'object') { table = table.tableName; }

    const analysis = await tableAnalyzer.analyzeTable(table);
    schema[table] = { fields: analysis[0], references: analysis[1] };
  });

  if (_.isEmpty(schema)) {
    console.log('💀  Oops, your database is empty. Please, ' +
      'create some tables before running Lumber update.💀');
    process.exit(1);
  }

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

  console.log(chalk.green('Your admin is up to date.'));
  process.exit(0);
})().catch((error) => {
  logger.error('💀  Oops, operation aborted 💀 due to the following error: ', error);
  process.exit(1);
});
