const _ = require('lodash');
const dotenv = require('dotenv');
const program = require('commander');
const logger = require('./services/logger');
const importFrom = require('import-from');
const Caster = require('./services/caster');
const Database = require('./services/database');
const DatabaseAnalyzer = require('./services/database-analyzer');
const inquirer = require('inquirer');
const argv = require('minimist')(process.argv.slice(2));

program
  .description('Install a Lumber plugin')
  .option('-e, --email <email>', 'Your Forest Admin account email')
  .option('-P, --password <password>', 'Your Forest Admin account password (ignored if token is set)')
  .option('-t, --token <token>', 'Your Forest Admin account token (replaces password)')
  .option('-p, --projectName <projectName>', 'Your Forest Admin project name')
  .parse(process.argv);

(async () => {
  // NOTICE: Load the environment variables from the .env to avoid always asking for the database
  //         connection information.
  dotenv.load();
  let dbDialect = process.env.DATABASE_URL.substring(0, process.env.DATABASE_URL.indexOf(':'));
  if (dbDialect === 'mongodb+srv') { dbDialect = 'mongodb'; }

  const config = {
    dbConnectionUrl: process.env.DATABASE_URL,
    dbSchema: process.env.DATABASE_SCHEMA,
    dbSSL: new Caster().toBoolean(process.env.DATABASE_SSL),
    dbDialect,
  };

  if (!program.args[0]) {
    logger.error(
      'Missing package in the command.',
      'Please specify the plugin\'s package name you want to install. Type lumber help for more information.',
    );

    return process.exit(1);
  }

  const pkg = importFrom(process.cwd(), program.args[0]);

  const connection = await new Database().connect(config);
  const schema = await new DatabaseAnalyzer(connection, config, false).perform();
  let promptConfig = {};

  if (_.isFunction(pkg.install)) {
    promptConfig = await pkg.install(logger, inquirer, argv);
  }

  await pkg.dump(schema, promptConfig, config);

  return process.exit(0);
})().catch((err) => {
  logger.error(err);
});
