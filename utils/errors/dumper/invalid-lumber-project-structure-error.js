const LumberError = require('../../lumber-error');

class InvalidLumberProjectStructureError extends LumberError {
  /**
   * @param {{
   *  reason?: string;
   *  possibleSolution?: string
   * }} [options]
   */
  constructor(path, reason) {
    super(`We are not able to detect a lumber project file architecture at this path: ${path}.`, undefined, { reason });
    this.name = 'InvalidLumberProjectStructureError';
  }
}

module.exports = InvalidLumberProjectStructureError;
