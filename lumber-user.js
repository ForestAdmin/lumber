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
  logger.success(`You're logged as ${chalk.green(decoded.data.data.attributes.email)}`);
} else {
  logger.success('You\'re not logged in.');
}
