// eslint-disable-next-line max-classes-per-file
class LumberError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class EmptyDatabase extends LumberError {}

const databaseAnalyzerErrors = {
  EmptyDatabase,
};

module.exports = {
  LumberError,
  databaseAnalyzerErrors,
};
