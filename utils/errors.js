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

class ConfigFileDoesNotExist extends LumberError {
  constructor(configPath) {
    super(`The configuration file "${configPath}" does not exist.`);
  }
}
class OutputDirectoryAlreadyExist extends LumberError {
  constructor(outputDirectory) {
    super(`The output directory "${outputDirectory}" already exist.`);
  }
}

const updateErrors = {
  ConfigFileDoesNotExist,
  OutputDirectoryAlreadyExist,
};

module.exports = {
  LumberError,
  databaseAnalyzerErrors,
  updateErrors,
};
