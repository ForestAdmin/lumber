const analyzeMongoCollections = require('./mongo-collections-analyzer');
const analyzeSequelizeTables = require('./sequelize-tables-analyzer');
const EmptyDatabaseError = require('../../utils/errors/database/empty-database-error');
const { terminate } = require('../../utils/terminator');

async function reportEmptyDatabase(orm, dialect) {
  const logs = [`Your database looks empty! Please create some ${orm === 'mongoose' ? 'collections' : 'tables'} before running the command.`];
  if (orm === 'sequelize') {
    logs.push('If not, check whether you are using a custom database schema (use in that case the --schema option).');
  }
  return terminate(1, {
    logs,
    errorCode: 'database_empty',
    errorMessage: 'Your database is empty.',
    context: {
      orm,
      dialect,
    },
  });
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
        if (error instanceof EmptyDatabaseError) {
          return reportEmptyDatabase(error.details.orm, error.details.dialect);
        }
        throw error;
      });
  };
}

module.exports = DatabaseAnalyzer;
