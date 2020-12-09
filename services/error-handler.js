const LumberError = require('../utils/lumber-error');

class ErrorHandler {
  /**
   * @param {import('../context/init').Context} context
   */
  constructor(context) {
    /** @private @readonly */
    this.terminator = context.terminator;
    /** @private @readonly */
    this.chalk = context.chalk;
    /** @private @readonly */
    this.messages = context.messages;

    ['terminator', 'chalk', 'messages'].forEach((name) => {
      if (!this[name]) throw new Error(`Missing dependency ${name}`);
    });
  }

  /**
   * @private
   * @param {LumberError} error
   * @returns {string[]}
   */
  getMessages(error) {
    const messages = [];
    if (error.reason) {
      messages.push(`${this.chalk.red(error.message)}: ${error.reason}`);
    } else {
      messages.push(this.chalk.red(error.message));
    }

    if (error.possibleSolution) {
      messages.push(error.possibleSolution);
    }

    return messages;
  }

  /**
   * @param {Error} error
   */
  async handle(error) {
    if (error instanceof LumberError) {
      await this.terminator.terminate(1, {
        logs: this.getMessages(error),
      });
    } else {
      const message = `${this.messages.ERROR_UNEXPECTED} ${this.chalk.red(error.message)}`;
      await this.terminator.terminate(1, {
        logs: [message],
      });
    }
  }
}

module.exports = ErrorHandler;
