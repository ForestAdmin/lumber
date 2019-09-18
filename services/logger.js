const chalk = require('chalk');

class Logger {
  constructor(silent) {
    this.silent = silent;
  }

  log(message) {
    if (!this.silent) {
      console.log(message);
    }
  }

  logLine(color, message) {
    this.log(`${chalk[color]('>')} ${message}`);
  }

  logLines(color, messages) {
    messages.forEach(message => this.logLine(color, message));
  }

  success(...messages) { this.logLines('green', messages); }
  info(...messages) { this.logLines('blue', messages); }
  warn(...messages) { this.logLines('yellow', messages); }
  error(...messages) { this.logLines('red', messages); }
}

module.exports = new Logger();
