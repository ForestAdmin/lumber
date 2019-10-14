const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
const Database = require('./services/database');
const DatabaseAnalyzer = require('./services/database-analyzer');
const Dumper = require('./services/dumper');
const CommandGenerateConfigGetter = require('./services/command-generate-config-getter');
const logger = require('./services/logger');
const EnvironmentChecker = require('./services/environment-checker');

program
  .description('Generate a backend application with an ORM/ODM configured')
  .option('-c, --connection-url <connectionUrl>', 'Enter the database credentials with a connection URL')
  // NOTICE: --ssl option is not a real boolean option since we do not want a breaking change.
  .option('-S, --ssl <ssl>', 'Use SSL for database connection (true|false)')
  .option('-H, --application-host <applicationHost>', 'Hostname of your admin backend application')
  .option('-p, --application-port <applicationPort>', 'Port of your admin backend application')
  .option('-s, --schema <schema>', 'Enter your database schema')
  .option('--no-db', 'Use Lumber without a database')
  .parse(process.argv);

(async () => {
  // NOTICE: Check deprecated environments variables.
  const environmentChecker = new EnvironmentChecker(process.env, logger, [
    'DATABASE_URL',
    'DATABASE_DIALECT',
    'DATABASE_NAME',
    'DATABASE_SCHEMA',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_SSL',
    'DATABASE_MONGODB_SRV',
    'APPLICATION_HOST',
    'APPLICATION_PORT',
  ]);
  environmentChecker.logWarnings();

  const config = await new CommandGenerateConfigGetter(program).perform();

  let schema = {};
  if (program.db) {
    const connection = await new Database().connect(config);
    schema = await new DatabaseAnalyzer(connection, config, true).perform();
  }

  const dumper = await new Dumper(config);

  await P.each(Object.keys(schema), async (table) => {
    await dumper.dump(table, schema[table]);
  });

  logger.success(`Hooray, ${chalk.green('installation success')}!`);
  process.exit(0);
})().catch((error) => {
  logger.error(
    'Cannot generate your project.',
    'An unexpected error occured. Please create a Github issue with following error:',
  );
  logger.log(error);
  process.exit(1);
});
