const chalk = require('chalk');

function logLine(color, message) {
  console.log(`${chalk[color]('>')} ${message}`);
}

function logLines(color, messages) {
  messages.forEach(message => logLine(color, message));
}

module.exports = {
  success: (...messages) => logLines('green', messages),
  info: (...messages) => logLines('blue', messages),
  warn: (...messages) => logLines('yellow', messages),
  error: (...messages) => logLines('red', messages),
};
