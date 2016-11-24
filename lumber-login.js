'use strict';
const program = require('commander');
const inquirer = require('inquirer');
const authenticator = require('./services/authenticator');
const chalk = require('chalk');

program
  .description('Sign in with an existing account.')
  .parse(process.argv);

let prompts = [{
  type: 'input',
  name: 'email',
  message: 'What\'s your email address? ',
  validate: (email) => {
    if (email) {
      return true;
    } else {
      return '🔥  Please enter your email address 🔥';
    }
  }
}, {
  type: 'password',
  name: 'password',
  message: 'What\'s your password: ',
  validate: (password) => {
    if (password) {
      return true;
    } else {
      return '🔥  Oops, your password cannot be blank 🔥';
    }
  }
}];

inquirer.prompt(prompts).then((config) => {
  if (process.env.SERVER_HOST) {
    config.serverHost = process.env.SERVER_HOST;
  } else {
    config.serverHost = 'https://forestadmin-server.herokuapp.com';
  }

  return authenticator
    .login(config)
    .then(() => {
      console.log(chalk.green(`👍  You're now logged as ${config.email} 👍 `));
    }, (err) => {
      if (err.status) {
        console.log('🔥  The email or password you entered is incorrect 🔥');
      }
    });
});
