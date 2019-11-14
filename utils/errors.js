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
};

class InvalidConnectionString extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

exports.ConnectionStringError = { InvalidConnectionString };
