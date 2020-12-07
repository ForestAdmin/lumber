const chalk = require('chalk');
const program = require('commander');
const fs = require('fs');
const mkdirpSync = require('mkdirp');
const path = require('path');
const Database = require('./services/database');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const spinners = require('./services/spinners');
const { updateErrors, LumberError } = require('./utils/errors');
const { ERROR_UNEXPECTED } = require('./utils/messages');
const { terminate } = require('./utils/terminator');

program
  .description('update your project by generating files that does not currently exist')
  .usage('<appName> [options]')
  .option('-c, --config <config-path>', 'Enter the databases configuration file to use', './config/databases.js')
  .option('-o, --output-directory <output-directory>', 'Enter the output directory where the files should be generated')
  .parse(process.argv);

(async () => {
  const config = path.resolve(program.config);
  const outputDirectory = program.outputDirectory && path.resolve(program.outputDirectory);
  if (!fs.existsSync(config)) {
    throw new updateErrors.ConfigFileDoesNotExist(config);
  }

  if (outputDirectory && fs.existsSync(outputDirectory)) {
    throw new updateErrors.OutputDirectoryAlreadyExist(outputDirectory);
  }

  if (outputDirectory) {
    mkdirpSync(outputDirectory);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const databasesConfig = require(config);

  const connectionPromise = Promise.all(new Database().connectFromDatabasesConfig(databasesConfig));
  spinners.add('databases-connection', { text: 'Connecting to your database(s)' }, connectionPromise);
  const connections = await connectionPromise;

  // const databasesSchema = await P.mapSeries(
  //   connections,
  //   (connection) => new DatabaseAnalyzer(connection, { dbSchema: 'public' }, true).perform(),
  // );

  const databasesSchema = await Promise.all(
    connections.map((connection) => new DatabaseAnalyzer(connection, { dbSchema: 'public' }, true).perform()),
  );

  console.log(databasesSchema);
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
