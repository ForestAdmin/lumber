const fs = require('fs');
const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
const DB = require('./services/db');
const TableAnalyzer = require('./services/table-analyzer');
const Dumper = require('./services/dumper');
const authenticator = require('./services/authenticator');
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
  .description('Generate the admin panel of your web application based on the database schema.')
  .option('-c, --connection-url <connectionUrl>', 'Enter the database credentials with a connection URL')
  .option('--no-db', 'Use Lumber without a database.')
  .parse(process.argv);

(async () => {
  let config;

  if (program.connectionUrl) {
    config = await Prompter(program, [
      'dbConnectionUrl',
      'appHostname',
      'appPort',
      'appName',
    ]);
  } else if (!program.db) {
    config = await Prompter(program, [
      'appHostname',
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
      'dbStorage',
      'appHostname',
      'appPort',
      'appName',
    ]);
  }

  // NOTICE: Ensure the project directory doesn't exist yet.
  const path = `${process.cwd()}/${config.appName}`;
  if (isDirectoryExist(path)) {
    logger.error(`💀  Oops, the directory ${path} already exists.💀`);
    process.exit(1);
  }

  let schema = {};
  if (program.db) {
    const db = await new DB().connect(config);
    schema = await new TableAnalyzer(db, config).perform();
  }

  let project;
  try {
    project = await authenticator.createProject(config);
  } catch (error) {
    if (error.message === 'Unauthorized') {
      logger.error('💀  Oops, you are unauthorized to connect to forest. 💀 Try the "lumber logout && lumber login" command.');
    } else if (error.message === 'Conflict') {
      logger.error(`💀  Oops, you already have a project named ${config.appName}. Please, choose another name for this project. 💀 `);
    } else {
      logger.error('💀  Oops, authentication operation aborted 💀 due to the following error: ', error);
    }
    process.exit(1);
  }

  const dumper = await new Dumper(project, config);

  await P.each(Object.keys(schema), async (table) => {
    await dumper.dump(table, schema[table].fields, schema[table].references);
  });

  console.log(chalk.green('\n👍  Hooray, installation success! 👍\n'));

  console.log(`change directory: \n $ ${chalk.green(`cd ${config.appName}`)}\n`);
  console.log(`install dependencies: \n $ ${chalk.green('npm install')}\n`);
  console.log(`run your admin panel application: \n $ ${chalk.green('npm start')}\n`);

  process.exit(0);
})().catch((error) => {
  logger.error('💀  Oops, operation aborted 💀 due to the following error: ', error);
  process.exit(1);
});
