const LumberError = require('../../lumber-error');

class UnableToCreateApplicationTokenError extends LumberError {
  /**
   * @param {{
   *  reason?: string;
   *  possibleSolution?: string
   * }} [options]
   */
  constructor(options) {
    super('Unable to create an application token on Forest Admin', undefined, options);
    this.name = 'UnableToCreateApplicationTokenError';
  }
}

module.exports = UnableToCreateApplicationTokenError;
