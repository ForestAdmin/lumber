const chalk = require('chalk');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const spinners = require('./services/spinners');
const Dumper = require('./services/dumper');
const { updateErrors, LumberError } = require('./utils/errors');
const { ERROR_UNEXPECTED } = require('./utils/messages');
const { terminate } = require('./utils/terminator');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

program
  .description('update your project by generating files that does not currently exist')
  .usage('<appName> [options]')
  .option('-c, --config <config-path>', 'Enter the databases configuration file to use', './config/databases.js')
  .parse(process.argv);

(async () => {
  const { database } = context.inject();

  const config = path.resolve(program.config);
  if (!fs.existsSync(config)) {
    throw new updateErrors.ConfigFileDoesNotExist(config);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const databasesConfig = require(config);

  let spinner = spinners.add('databases-connection', { text: 'Connecting to your database(s)' });
  const connections = database.connectFromDatabasesConfig(databasesConfig);
  spinner.succeed();

  spinner = spinners.add('analyse', { text: 'Analyse database(s)' });
  const databasesSchema = {};
  await Promise.all(
    Object.entries(connections)
      .map(async ([dbName, connection]) => {
        databasesSchema[dbName] = await new DatabaseAnalyzer(connection, { dbSchema: 'public' }, true).perform();
        return databasesSchema[dbName];
      }),
  );
  spinner.succeed();

  spinner = spinners.add('dumper', { text: 'Generating your files' });
  const dumper = new Dumper({});
  await dumper.redump(databasesSchema);
  spinner.succeed();

  // console.log(databasesSchema);
  console.info(`Hooray, ${chalk.green('installation success')}!`);
  process.exit(0);
})().catch(async (error) => {
  console.log(error);
  const logs = ['Cannot update your project.'];
  if (error instanceof LumberError) {
    logs.push(error.message);
  } else {
    logs.push(`${ERROR_UNEXPECTED} ${chalk.red(error)}`);
  }

  await terminate(1, {
    logs,
  });
});
