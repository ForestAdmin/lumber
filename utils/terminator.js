const logger = require('../services/logger');
const eventSender = require('../services/event-sender');

module.exports = {
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
