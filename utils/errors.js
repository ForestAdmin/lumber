const chalk = require('chalk');

function createLumberError(name) {
  function LumberError(message, details) {
    this.name = name;
    this.userMessage = message;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  return LumberError;
}

exports.DatabaseAnalyzerError = {
  EmptyDatabase: createLumberError('EmptyDatabase'),
  UnexpectedError: error => `An unexpected error occurred. Please reach out for help in our Slack community or create a Github issue with following error: ${chalk.red(error)}`,
};
