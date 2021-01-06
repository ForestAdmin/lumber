require('dotenv').config();
const program = require('commander');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const spinners = require('./services/spinners');
const { updateErrors } = require('./utils/errors');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

program
  .description('update your project by generating files that does not currently exist')
  .option('-c, --config <config-path>', 'the databases configuration file to use', './config/databases.js')
  .option('-o, --output-directory <output-directory-path>', 'the output directory to export new files into')
  .parse(process.argv);

const {
  database,
  dumper,
  errorHandler,
  fs,
  path,
} = context.inject();

(async () => {
  const options = {
    dbSchema: process.env.DATABASE_SCHEMA,
    appName: program.outputDirectory,
  };
  dumper.checkIsLianaCompatible();

  if (program.outputDirectory) {
    await dumper.createOutputDirectoryIfNotExist(program.outputDirectory);
  } else {
    dumper.checkIsValidLumberProject();
  }

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

  process.exit(0);
})().catch(async (error) => {
  await errorHandler.handle(error);
});
