const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
const Database = require('./services/database');
const DatabaseAnalyzer = require('./services/database-analyzer');
const Dumper = require('./services/dumper');
const CommandGenerateConfigGetter = require('./services/command-generate-config-getter');
const logger = require('./services/logger');

program
  .description('Generate a backend application with an ORM/ODM configured.')
  .option('-c, --connection-url <connectionUrl>', 'Enter the database credentials with a connection URL')
  .option('--silent', 'Do not print any logs')
  .option('--no-db', 'Use Lumber without a database.')
  .parse(process.argv);

(async () => {
  if (program.silent) {
    logger.silent = true;
  }

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

  logger.log('\n');
  logger.success(`Hooray, ${chalk.green('installation success')}!\n`);

  logger.log(`change directory: \n $ ${chalk.blue(`cd ${config.appName}`)}\n`);

  logger.log(`install dependencies: \n $ ${chalk.blue('npm install -s')}\n`);
  logger.log(`run your application: \n $ ${chalk.blue('npm start')}\n`);
  process.exit(0);
})().catch((error) => {
  logger.error(
    'Cannot generate your project.',
    'An unexpected error occured. Please create a Github issue with following error:',
  );
  logger.log(error, true);
  process.exit(1);
});
