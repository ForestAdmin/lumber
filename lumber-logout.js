'use strict';
const program = require('commander');
const os = require('os');
const fs = require('fs');
const chalk = require('chalk');

program
  .description('Sign out of your account.')
  .parse(process.argv);

let path = `${os.homedir()}/.lumberrc`;

fs.stat(path, (err) => {
  if (err === null) {
    fs.unlinkSync(path);
    console.log(chalk.green(`👍  You're now unlogged 👍 `));
  } else if (err.code === 'ENOENT') {
    console.log('🔥  You\'re not logged 🔥');
  }
});

