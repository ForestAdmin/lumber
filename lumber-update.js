const program = require('commander');
const chalk = require('chalk');
const dotenv = require('dotenv');
const inquirer = require('inquirer');
const P = require('bluebird');
const spinners = require('./services/spinners');
const Database = require('./services/database');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const Dumper = require('./services/dumper');
const logger = require('./services/logger');
const DiffDetector = require('./services/diff-detector');
const { terminate } = require('./utils/terminator');
const { ERROR_UNEXPECTED } = require('./utils/messages');

program
  .description('Check the differences between your current admin api configuration and your database to generate what is missing')
  .parse(process.argv);

async function askForConfirmation(spinner, message) {
  spinner.pause();
  const result = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message,
    default: true,
  }]);
  spinner.continue();
  return result.confirm;
}

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
  const deletedTables = diffDetector.detectDeletedTables(schema);
  const deletedFields = diffDetector.detectDeletedFields(schema);
  const deletedReferences = diffDetector.detectDeletedRelationships(schema);
  diffSpinner.succeed();

  const spinner = spinners.add('dumper', { text: 'Creating your project files' });
  logger.spinner = spinner;
  const dumper = new Dumper(config);

  await P.each(newTables, async (table) => {
    if (await askForConfirmation(spinner, `Create model ${table}?`)) {
      dumper.dumpModel(table, schema[table]);
    }
  });

  await P.each(Object.keys(newFields), async (tableName) => {
    const newFieldsInTable = newFields[tableName];

    await P.each(newFieldsInTable, async (field) => {
      if (await askForConfirmation(spinner, `Create field ${field.name} into ${tableName}?`)) {
        dumper.dumpFieldIntoModel(tableName, field);
      }
    });
  });

  await P.each(Object.keys(newReferences), async (tableName) => {
    const newReferencesInTable = newReferences[tableName];

    await P.each(newReferencesInTable, async (reference) => {
      if (await askForConfirmation(spinner, `Create reference with foreignKey ${reference.foreignKey} into ${tableName}?`)) {
        dumper.dumpReferenceIntoModel(tableName, reference);
      }
    });
  });

  await P.each(deletedTables, async (table) => {
    if (await askForConfirmation(spinner, `Delete model ${table}?`)) {
      dumper.removeModel(table);
    }
  });

  await P.each(Object.keys(deletedFields), async (tableName) => {
    const deletedFieldsInTable = deletedFields[tableName];

    await P.each(deletedFieldsInTable, async (fieldName) => {
      if (await askForConfirmation(spinner, `Remove field ${fieldName} from ${tableName}?`)) {
        dumper.removeFieldFromModel(tableName, fieldName);
      }
    });
  });

  await P.each(Object.keys(deletedReferences), async (tableName) => {
    const deletedReferencesInTable = deletedReferences[tableName];

    await P.each(deletedReferencesInTable, async (fieldName) => {
      if (await askForConfirmation(spinner, `Remove reference with foreignKey ${fieldName} from ${tableName}?`)) {
        dumper.removeReferenceFromModel(tableName, fieldName);
      }
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
