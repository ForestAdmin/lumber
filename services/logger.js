const chalk = require('chalk');

class Logger {
  constructor(silent) {
    this.silent = silent;
  }

  _logMessage(message, force) {
    if (!this.silent || force) {
      console.log(message);
    }
  }

  log(message, force = false) {
    this._logMessage(message, force);
  }

  logLine(color, message, force = false) {
    this._logMessage(`${chalk[color]('>')} ${message}`, force);
  }

  logLines(color, messages, force = false) {
    messages.forEach(message => this.logLine(color, message, force));
  }

  success(...messages) { this.logLines('green', messages); }
  info(...messages) { this.logLines('blue', messages); }
  warn(...messages) { this.logLines('yellow', messages, true); }
  error(...messages) { this.logLines('red', messages, true); }
}

module.exports = new Logger();
