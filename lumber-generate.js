const program = require('commander');
const chalk = require('chalk');
const Prompter = require('./services/prompter');
const logger = require('./services/logger');
const generate = require('./app/generate');

async function main() {
  try {
    const config = await run();

    console.log(chalk.green('\n👍  Hooray, installation success! 👍\n'));
    console.log(`change directory: \n $ ${chalk.green(`cd ${config.appName}`)}\n`);
    console.log(`install dependencies: \n $ ${chalk.green('npm install')}\n`);
    console.log(`run your back office application: \n $ ${chalk.green('npm start')}\n`);

    process.exit(0);
  } catch (err) {
    if (err.message === 'Unauthorized') {
      logger.error('💀  Oops, you are unauthorized to connect to forest. 💀 Try the "lumber logout && lumber login" command.');
    } else {
      logger.error('💀  Oops, operation aborted 💀 due to the following error: ', err);
    }
    process.exit(1);
  }
}

async function run() {
  let projectName;

  program
    .arguments('[projectName]')
    .description('Generate the back office of your web application based on the database schema.')
    .option('-c, --connection-url', 'Enter the database credentials with a connection URL')
    .option('--no-db', 'Use Lumber without a database.')
    .action((projectNameArg) => { projectName = projectNameArg; })
    .parse(process.argv);

  const args = [
    'dbConnectionUrl',
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
  ];
  if (!projectName) {
    args.push('appName');
  }

  const config = await Prompter(program, args);
  config.db = program.db;
  if (projectName) {
    config.appName = projectName;
  }

  await generate(config);

  return config;
}

main();
