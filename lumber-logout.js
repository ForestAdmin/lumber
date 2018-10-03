const program = require('commander');
const os = require('os');
const fs = require('fs');
const chalk = require('chalk');
const logger = require('./services/logger');
const authenticator = require('./services/authenticator');

program
  .description('Sign out of your account.')
  .parse(process.argv);

(async () => {
  await authenticator.logout({ log: true });
});
