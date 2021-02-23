const LumberError = require('../../lumber-error');

class IncompatibleLianaForUpdateError extends LumberError {
  /**
   * @param {{
   *  reason?: string;
   *  possibleSolution?: string
   * }} [options]
   */
  constructor(reason) {
    super('The liana is incompatible for update', undefined, { reason });
    this.name = 'IncompatibleLianaForUpdateError';
  }
}

module.exports = IncompatibleLianaForUpdateError;
