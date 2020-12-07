const logger = require('../services/logger');
const eventSender = require('../services/event-sender');

/**
 * @typedef {{
 *  errorCode: string;
 *  errorMessage: string;
 *  context: any;
 * }} DetailedLog
 *
 * @typedef {{
 *  logs: string[]
 * }} MultipleMessages
 */

module.exports = {
  /**
   * @param {number} status
   * @param {DetailedLog | MultipleMessages | DetailedLog & MultipleMessages} log
   */
  async terminate(status, {
    errorCode, errorMessage, logs, context,
  }) {
    if (status !== 0 && logger.spinner) {
      logger.spinner.fail();
    }
    if (logs.length) {
      logger.error(...logs);
    }
    if (errorCode) {
      await eventSender.notifyError(errorCode, errorMessage, context);
    } else {
      await eventSender.notifyError();
    }

    process.exit(status);
  },
};
