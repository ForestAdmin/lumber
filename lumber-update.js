require('dotenv').config();
const program = require('commander');
const DatabaseAnalyzer = require('./services/analyzer/database-analyzer');
const spinners = require('./services/spinners');
const LumberError = require('./utils/lumber-error');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

program
  .description('Update your project by generating files that does not currently exist')
  .option('-c, --config <config-path>', 'The databases configuration file to use', './config/databases.js')
  .option('-o, --output-directory <output-directory-path>', 'The output directory to export new files into')
  .parse(process.argv);

const {
  database,
  dumper,
  env,
  errorHandler,
  fs,
  logger,
  path,
} = context.inject();

(async () => {
  const options = {
    dbSchema: env.DATABASE_SCHEMA,
    appName: program.outputDirectory,
    isUpdate: true,
  };

  dumper.checkLianaCompatiblityForUpdate();

  const { outputDirectory } = program;
  if (!outputDirectory) {
    dumper.checkLumberProjectStructure();
  } else if (fs.existsSync(outputDirectory)) {
    throw new LumberError(`The output directory "${outputDirectory}" already exist.`);
  }

  const configPath = path.resolve(program.config);
  if (!fs.existsSync(configPath)) {
    throw new LumberError(`The configuration file "${configPath}" does not exist.`);
  }

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const databasesConfig = require(configPath);
  if (!database.areAllDatabasesOfTheSameType(databasesConfig)) {
    throw new LumberError(`The "${configPath}" file contains different databases types.`);
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

  options.useMultiDatabase = databasesSchema.length > 1;

  spinner = spinners.add('dumper', { text: 'Generating your files' });
  await Promise.all(databasesSchema.map((databaseSchema) =>
    dumper.dump(databaseSchema.schema, {
      ...options,
      modelsExportPath: path.relative('models', databaseSchema.modelsDir),
    })));
  spinner.succeed();

  if (!outputDirectory && options.useMultiDatabase && !dumper.hasMultipleDatabaseStructure()) {
    logger.warn('It looks like you are switching from a single to a multiple databases.');
    logger.log('You will need to move the models files from your existing database to the dedicated folder, or simply remove them.');
  }

  process.exit(0);
})().catch(async (error) => {
  await errorHandler.handle(error);
});
