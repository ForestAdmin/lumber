const program = require('commander');
const chalk = require('chalk');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

const spinners = require('./services/spinners');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const CommandGenerateConfigGetter = require('./services/command-generate-config-getter');
const eventSender = require('./services/event-sender');
const ProjectCreator = require('./services/project-creator');
const { terminate } = require('./utils/terminator');
const { ERROR_UNEXPECTED } = require('./utils/messages');

const { logger, authenticator, dumper } = context.inject();

if (!authenticator) throw new Error('Missing dependency authenticator');
if (!logger) throw new Error('Missing dependency logger');
if (!dumper) throw new Error('Missing dependency dumper');

program
  .description('Generate a backend application with an ORM/ODM configured')
  .usage('<appName> [options]')
  .option('-c, --connection-url <connectionUrl>', 'Enter the database credentials with a connection URL')
  // NOTICE: --ssl option is not a real boolean option since we do not want a breaking change.
  .option('-S, --ssl <ssl>', 'Use SSL for database connection (true|false)')
  .option('-H, --application-host <applicationHost>', 'Hostname of your admin backend application')
  .option('-p, --application-port <applicationPort>', 'Port of your admin backend application')
  .option('-s, --schema <schema>', 'Enter your database schema')
  .option('-e, --email <email>', 'Your Forest Admin account email')
  .option('-P, --password <password>', 'Your Forest Admin account password (ignored if token is set)')
  .option('-t, --token <token>', 'Your Forest Admin account token (replaces password)')
  .parse(process.argv);

(async () => {
  const { database } = context.inject();

  eventSender.command = 'generate';
  [eventSender.appName] = program.args;

  const config = await new CommandGenerateConfigGetter(program).perform();
  const sessionToken = await authenticator.loginFromCommandLine(config);

  let schema = {};

  const connectionPromise = database.connect(config);
  spinners.add('database-connection', { text: 'Connecting to your database' }, connectionPromise);
  const connection = await connectionPromise;

  const schemaPromise = new DatabaseAnalyzer(connection, config, true).perform();
  spinners.add('database-analysis', { text: 'Analyzing the database' }, schemaPromise);
  schema = await schemaPromise;

  const projectCreationPromise = new ProjectCreator(sessionToken)
    .createProject(config.appName, config);
  spinners.add('project-creation', { text: 'Creating your project on Forest Admin' }, projectCreationPromise);

  const { envSecret, authSecret } = await projectCreationPromise;
  config.forestEnvSecret = envSecret;
  config.forestAuthSecret = authSecret;

  const spinner = spinners.add('dumper', { text: 'Creating your project files' });
  logger.spinner = spinner;
  await dumper.dump(schema, config);
  spinner.succeed();

  logger.success(`Hooray, ${chalk.green('installation success')}!`);
  await eventSender.notifySuccess();
  process.exit(0);
})().catch(async (error) => {
  const logs = [
    'Cannot generate your project.',
    `${ERROR_UNEXPECTED} ${chalk.red(error)}`,
  ];

  await terminate(1, {
    logs,
  });
});
