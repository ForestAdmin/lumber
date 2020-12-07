const openIdClient = require('openid-client');

class OidcError extends Error {
  /**
   * @param {string} message
   * @param {Error|undefined} reason
   * @param {string} [possibleSolution]
   */
  constructor(message, reason, possibleSolution) {
    super(message);
    this.name = 'OidcError';
    /** @public @readonly */
    this.possibleSolution = possibleSolution;

    if (reason instanceof openIdClient.errors.OPError) {
      /** @public @readonly @type {string} */
      this.reason = reason.error || reason.message;
    } else if (reason) {
      this.reason = reason.message;
    }
  }
}

module.exports = OidcError;
