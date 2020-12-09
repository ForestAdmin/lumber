const LumberError = require('./lumber-error');

function createLumberError(name) {
  class CustomError extends LumberError {
    constructor(message, details) {
      super(message, details);
      this.name = name;
    }
  }

  return CustomError;
}

exports.DatabaseAnalyzerError = {
  EmptyDatabase: createLumberError('EmptyDatabase'),
};
