const program = require('commander');
const os = require('os');
const fs = require('fs');
const chalk = require('chalk');
const logger = require('./services/logger');

program
  .description('Sign out of your account.')
  .parse(process.argv);

const path = `${os.homedir()}/.lumberrc`;

fs.stat(path, (err) => {
  if (err === null) {
    fs.unlinkSync(path);
    console.log(chalk.green('👍  You\'re now unlogged 👍 '));
  } else if (err.code === 'ENOENT') {
    logger.error('🔥  You\'re not logged 🔥');
  }
});
