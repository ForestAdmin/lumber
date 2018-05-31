const program = require('commander');
const jwt = require('jsonwebtoken');
const authenticator = require('./services/authenticator');
const chalk = require('chalk');
const logger = require('./services/logger');

program
  .description('Display the email address of your user account.')
  .parse(process.argv);

const token = authenticator.getAuthToken();
if (token) {
  const decoded = jwt.decode(token);
  console.log(chalk.bold('Email: ') + chalk.cyan(decoded.data.data.attributes.email));
} else {
  logger.error('🔥  You\'re not logged 🔥');
}

