const fs = require('fs');
const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
const DB = require('./services/db');
const TableAnalyzer = require('./services/table-analyzer');
const Dumper = require('./services/dumper');
const Prompter = require('./services/prompter');
const logger = require('./services/logger');

function isDirectoryExist(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

program
  .description('Generate a backend application with an ORM/ODM configured.')
  .option('-c, --connection-url <connectionUrl>', 'Enter the database credentials with a connection URL')
  .option('--no-db', 'Use Lumber without a database.')
  .parse(process.argv);

(async () => {
  let config;

  if (program.connectionUrl) {
    config = await Prompter(program, [
      'dbConnectionUrl',
      'appPort',
      'appName',
    ]);
  } else if (!program.db) {
    config = await Prompter(program, [
      'appPort',
      'appName',
    ]);
  } else {
    config = await Prompter(program, [
      'dbDialect',
      'dbName',
      'dbSchema',
      'dbHostname',
      'dbPort',
      'dbUser',
      'dbPassword',
      'mongodbSrv',
      'ssl',
      'appHostname',
      'appPort',
      'appName',
    ]);
  }

  // NOTICE: Ensure the project directory doesn't exist yet.
  const path = `${process.cwd()}/${config.appName}`;
  if (isDirectoryExist(path)) {
    logger.error(
      `The directory ${chalk.red(path)} already exists.`,
      'Please retry with a new directory.',
    );
    process.exit(1);
  }

  let schema = {};
  if (program.db) {
    const db = await new DB().connect(config);
    schema = await new TableAnalyzer(db, config).perform();
  }

  const dumper = await new Dumper(config);

  await P.each(Object.keys(schema), async (table) => {
    await dumper.dump(table, {
      fields: schema[table].fields,
      references: schema[table].references,
      primaryKeys: schema[table].primaryKeys,
    });
  });

  console.log('\n');
  logger.success(`Hooray, ${chalk.green('installation success')}!\n`);

  console.log(`change directory: \n $ ${chalk.blue(`cd ${config.appName}`)}\n`);

  console.log(`install dependencies: \n $ ${chalk.blue('npm install')}\n`);
  console.log(`run your application: \n $ ${chalk.blue('npm start')}\n`);
  process.exit(0);
})().catch((error) => {
  logger.error(
    'Cannot generate your project.',
    'An unexpected error occured. Please create a Github issue with following error:',
  );
  console.log(error);
  process.exit(1);
});
