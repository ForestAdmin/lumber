class PrompterError extends Error {
  constructor(errorMessage, logs) {
    super(errorMessage);
    this.errorCode = 'unexpected_error';
    this.errorMessage = errorMessage;
    this.logs = logs;
  }
}

module.exports = PrompterError;
