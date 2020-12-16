require('dotenv').config();
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
  const options = {
    dbSchema: process.env.DATABASE_SCHEMA,
  };
  const dumper = new Dumper(options);
  dumper.checkIsValidLumberProject();

  const config = path.resolve(program.config);
  if (!fs.existsSync(config)) {
    throw new updateErrors.ConfigFileDoesNotExist(config);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const databasesConfig = require(config);

  let spinner = spinners.add('databases-connection', { text: 'Connecting to your database(s)' });
  const databasesConnection = await database.connectFromDatabasesConfig(databasesConfig);
  spinner.succeed();

  spinner = spinners.add('analyze-databases', { text: 'Analyzing the database(s)' });
  const databasesSchema = await Promise.all(
    databasesConnection
      .map(async (databaseConnection) => {
        options.dbDialect = database.getDialect(databaseConnection.connection.url);

        const schema = await new DatabaseAnalyzer(
          databaseConnection.connectionInstance,
          options,
          true,
        ).perform();

        return {
          ...databaseConnection,
          schema,
        };
      }),
  );
  spinner.succeed();

  spinner = spinners.add('dumper', { text: 'Generating your files' });
  await dumper.redump(databasesSchema, options);
  spinner.succeed();

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
