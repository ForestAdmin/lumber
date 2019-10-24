const VError = require('verror');
const util = require('util');

function createLumberError(name) {
  function LumberError(message, details) {
    VError.call(this, name);
    this.name = name;
    this.userMessage = message;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  util.inherits(LumberError, VError);

  return LumberError;
}

exports.DatabaseAnalyzerError = {
  EmptyDatabase: createLumberError('EmptyDatabase'),
};