const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
// const ora = require('ora');
const spinners = require('./services/spinners');
const Database = require('./services/database');
const DatabaseAnalyzer = require('./services/database-analyzer');
const Dumper = require('./services/dumper');
const CommandGenerateConfigGetter = require('./services/command-generate-config-getter');
const logger = require('./services/logger');
const eventSender = require('./services/event-sender');
const ProjectCreator = require('./services/project-creator');
const { terminate } = require('./utils/terminator');

program
  .description('Generate a backend application with an ORM/ODM configured')
  .usage('<appName> [options]')
  .option('-c, --connection-url <connectionUrl>', 'Enter the database credentials with a connection URL')
  // NOTICE: --ssl option is not a real boolean option since we do not want a breaking change.
  .option('-S, --ssl <ssl>', 'Use SSL for database connection (true|false)')
  .option('-H, --application-host <applicationHost>', 'Hostname of your admin backend application')
  .option('-p, --application-port <applicationPort>', 'Port of your admin backend application')
  .option('-s, --schema <schema>', 'Enter your database schema')
  .option('--no-db', 'Use Lumber without a database')
  .option('-e, --email <email>', 'Your Forest Admin account email')
  .option('-P, --password <password>', 'Your Forest Admin account password (ignored if token is set)')
  .option('-t, --token <token>', 'Your Forest Admin account token (replaces password)')
  .parse(process.argv);

(async () => {
  eventSender.command = 'generate';
  [eventSender.appName] = program.args;

  const config = await new CommandGenerateConfigGetter(program).perform();
  let schema = {};

  if (program.db) {
    const connectionPromise = new Database().connect(config);
    spinners.add('database-connection', { text: 'Connecting to database' }, connectionPromise);
    const connection = await connectionPromise;

    const schemaPromise = new DatabaseAnalyzer(connection, config, true).perform();
    spinners.add('database-analysis', { text: 'Analyzing your database' }, schemaPromise);
    schema = await schemaPromise;
  }

  const projectCreationPromise = new ProjectCreator(logger)
    .createProject(config.appName, config);
  spinners.add('project-creation', { text: 'Creating your project on forestadmin' }, projectCreationPromise);

  const { envSecret, authSecret } = await projectCreationPromise;
  config.forestEnvSecret = envSecret;
  config.forestAuthSecret = authSecret;

  const spinner = spinners.add('dumper', { text: 'Creating your project files' });
  logger.spinner = spinner;
  const dumper = await new Dumper(config);

  await P.each(Object.keys(schema), async (table) => {
    await dumper.dump(table, schema[table]);
  });
  spinner.succeed();

  logger.success(`Hooray, ${chalk.green('installation success')}!`);
  await eventSender.notifySuccess();
  process.exit(0);
})().catch(async (error) => {
  const logs = [
    'Cannot generate your project.',
    'An unexpected error occured. Please create a Github issue with following error:',
    error,
  ];

  await terminate(1, {
    logs,
  });
});
