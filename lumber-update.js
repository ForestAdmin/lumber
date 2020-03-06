const program = require('commander');
const chalk = require('chalk');
const dotenv = require('dotenv');
const spinners = require('./services/spinners');
const Database = require('./services/database');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const Dumper = require('./services/dumper');
const logger = require('./services/logger');
const DiffDetector = require('./services/diff-detector');
const { terminate } = require('./utils/terminator');
const { ERROR_UNEXPECTED } = require('./utils/messages');

program
  .description('Check the difference between you actual configuration and your database and generate what is missing')
  .parse(process.argv);

(async () => {
  dotenv.config();
  const config = {
    appName: '',
    dbConnectionUrl: process.env.DATABASE_URL,
    dbSchema: process.env.DATABASE_SCHEMA,
    dbSSL: process.env.DATABASE_SSL && JSON.parse(process.env.DATABASE_SSL),
  };

  let schema = {};

  const connectionPromise = new Database().connect(config);
  spinners.add('database-connection', { text: 'Connecting to your database' }, connectionPromise);
  const connection = await connectionPromise;

  const schemaPromise = new DatabaseAnalyzer(connection, config, true).perform();
  spinners.add('database-analysis', { text: 'Analyzing the database' }, schemaPromise);
  schema = await schemaPromise;

  const diffSpinner = spinners.add('diff-check', { text: 'Check the difference with your actual models' });
  const diffDetector = new DiffDetector({ sourceDirectory: '.' });
  const newTables = diffDetector.detectNewTables(schema);
  const newFields = diffDetector.detectNewFields(schema);
  const newReferences = diffDetector.detectNewRelationships(schema);
  diffSpinner.succeed();

  const spinner = spinners.add('dumper', { text: 'Creating your project files' });
  logger.spinner = spinner;
  const dumper = new Dumper(config);

  newTables.forEach((table) => {
    dumper.dumpModel(table, schema[table]);
  });

  Object.keys(newFields).forEach((tableName) => {
    const newFieldsInTable = newFields[tableName];

    newFieldsInTable.forEach((field) => {
      dumper.dumpFieldIntoModel(tableName, field);
    });
  });

  Object.keys(newReferences).forEach((tableName) => {
    const newReferencesInTable = newReferences[tableName];

    newReferencesInTable.forEach((reference) => {
      dumper.dumpReferenceIntoModel(tableName, reference);
    });
  });

  spinner.succeed();

  logger.success(`Hooray, ${chalk.green('update success')}!`);
  process.exit(0);
})().catch(async (error) => {
  const logs = [
    'Cannot update your project.',
    `${ERROR_UNEXPECTED} ${chalk.red(error)}`,
  ];

  await terminate(1, {
    logs,
  });
});
