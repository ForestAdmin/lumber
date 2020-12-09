const openIdClient = require('openid-client');
const LumberError = require('../../utils/lumber-error');

class OidcError extends LumberError {
  /**
   * @param {string} message
   * @param {Error|undefined} origin
   * @param {string} [possibleSolution]
   */
  constructor(message, origin, possibleSolution) {
    let reason;

    if (origin instanceof openIdClient.errors.OPError) {
      /** @public @readonly @type {string} */
      reason = origin.error || origin.message;
    } else if (origin) {
      reason = origin.message;
    }

    super(message, undefined, { reason, possibleSolution });

    this.name = 'OidcError';
  }
}

module.exports = OidcError;
