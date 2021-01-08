require('dotenv').config();
const program = require('commander');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const spinners = require('./services/spinners');
const LumberError = require('./utils/lumber-error');
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
  logger,
  path,
} = context.inject();

(async () => {
  const options = {
    dbSchema: process.env.DATABASE_SCHEMA,
    appName: program.outputDirectory,
    isUpdate: true,
  };
  dumper.checkLianaCompatiblityForUpdate();

  const { outputDirectory } = program;
  if (outputDirectory && fs.existsSync(outputDirectory)) {
    throw new LumberError(`The output directory "${outputDirectory}" already exist.`);
  } else {
    dumper.checkLumberProjectStructure();
  }

  const configPath = path.resolve(program.config);
  if (!fs.existsSync(configPath)) {
    throw new LumberError(`The configuration file "${configPath}" does not exist.`);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const databasesConfig = require(configPath);
  if (!database.isDatabasesCompatibleFromConfig(configPath)) {
    // TODO find better wording
    throw new LumberError('You try to update your project with incompatible databases dialect.');
  }

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

  options.useMultiDatabase = databasesConfig.length > 1;

  spinner = spinners.add('dumper', { text: 'Generating your files' });
  await Promise.all(databasesSchema.map(async (databaseSchema) => {
    const dbName = databaseSchema.name;
    const subSpinner = spinners.add(`dumper-${dbName}`, { text: `Generating files linked to ${dbName} database` });
    await dumper.dump(databaseSchema.schema, { ...options, dbName });
    subSpinner.succeed();
  }));
  spinner.succeed();

  if (!outputDirectory && options.useMultiDatabase && !dumper.isMultipleDatabaseStructure()) {
    logger.warn('It looks like you are switching from a single to multiple databases.');
    logger.log('You will need to move the models files from your existing database to the dedicated folder, or simply remove them.');
  }

  process.exit(0);
})().catch(async (error) => {
  await errorHandler.handle(error);
});
