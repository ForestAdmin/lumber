const _ = require('lodash');
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
  .description('Generate your admin interface based on your database schema.')
  .option('-c, --connection-url', 'Enter the database credentials with a connection URL')
  .option('--no-db', 'Use Lumber without a database.')
  .parse(process.argv);

(async () => {
  const schema = {};
  const config = await Prompter(program, [
    'dbCollectionUrl',
    'dbDialect',
    'dbName',
    'dbSchema',
    'dbHostname',
    'dbPort',
    'dbUser',
    'dbPassword',
    'dbStorage',
    'appHostname',
    'appPort',
    'appName',
    'email',
    'password',
  ]);

  // NOTICE: Ensure the project directory doesn't exist yet.
  const path = `${process.cwd()}/${config.appName}`;
  if (isDirectoryExist(path)) {
    logger.error(`💀  Oops, the directory ${path} already exists.💀`);
    process.exit(1);
  }

  if (program.db) {
    const db = await new DB().connect(config);
    const queryInterface = db.getQueryInterface();
    const tableAnalyzer = new TableAnalyzer(queryInterface, config);

    // Build the db schema.
    await P.mapSeries(queryInterface.showAllTables({
      schema: config.dbSchema,
    }), async (table) => {
      // NOTICE: MS SQL returns objects instead of strings.
    // eslint-disable-next-line no-param-reassign
      if (typeof table === 'object') { table = table.tableName; }

      const analysis = await tableAnalyzer.analyzeTable(table);
      schema[table] = { fields: analysis[0], references: analysis[1] };
    });

    if (_.isEmpty(schema)) {
      logger.error('💀  Oops, your database is empty. Please, ' +
        'create some tables before running Lumber generate.💀');
      process.exit(1);
    }

    let project;
    if (config.authToken) {
      project = await authenticator.createProject(config);
    } else {
      project = await authenticator.register(config);
    }

    const dumper = await new Dumper(project, config);
    await P.each(Object.keys(schema), async (table) => {
      await dumper.dump(table, schema[table].fields, schema[table].references);
    });

    console.log(chalk.green('\n👍  Hooray, installation success! 👍\n'));

    console.log(`change directory: \n $ ${chalk.green(`cd ${config.appName}`)}\n`);
    console.log(`install dependencies: \n $ ${chalk.green('npm install')}\n`);
    console.log(`run your admin interface: \n $ ${chalk.green('npm start')}\n`);

    process.exit(0);
  }
})();
