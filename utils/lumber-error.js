class LumberError extends Error {
  /**
   * @param {string} message
   * @param {any} [details]
   * @param {{
   *  reason?: string;
   *  possibleSolution?: string;
   * }} [options]
   */
  constructor(message, details, options) {
    super(message);

    /** @public @readonly */
    this.name = 'LumberError';

    /** @public @readonly */
    this.userMessage = message;

    /** @public @readonly */
    this.details = details;

    /** @public @readonly */
    this.reason = options && options.reason;

    /** @public @readonly */
    this.possibleSolution = options && options.possibleSolution;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = LumberError;
