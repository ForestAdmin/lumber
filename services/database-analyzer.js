const analyzeMongoCollections = require('./analyze-mongo-collections');
const analyzeSequelizeTables = require('./analyze-sequelize-tables');
const { DatabaseAnalyzerError } = require('../utils/errors');
const logger = require('./logger');
const eventSender = require('./event-sender');

async function reportEmptyDatabase(orm, dialect) {
  const logs = [`Your database looks empty! Please create some ${orm === 'mongoose' ? 'collections' : 'tables'} before running the command.`];
  if (orm === 'sequelize') {
    logs.push('If not, check whether you are using a custom database schema (use in that case the --schema option).');
  }
  logger.error(...logs);
  await eventSender.notifyError('database_empty', 'Your database is empty.', {
    orm,
    dialect,
  });
  return process.exit(1);
}

function DatabaseAnalyzer(databaseConnection, config, allowWarning) {
  this.perform = async () => {
    let analyze;
    if (config.dbDialect === 'mongodb') {
      analyze = analyzeMongoCollections;
    } else {
      analyze = analyzeSequelizeTables;
    }
    return analyze(databaseConnection, config, allowWarning)
      .catch((error) => {
        if (error.constructor === DatabaseAnalyzerError.EmptyDatabase) {
          return reportEmptyDatabase(error.details.orm, error.details.dialect);
        }
        throw error;
      });
  };
}

module.exports = DatabaseAnalyzer;
