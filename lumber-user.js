#! /usr/bin/env node
'use strict';
const program = require('commander');
const jwt = require('jsonwebtoken');
const authenticator = require('./services/authenticator');
const chalk = require('chalk');

program
  .description('Display the email address of your user account.')
  .parse(process.argv);

let token = authenticator.getAuthToken();
if (!token) {
  return console.log('🔥  You\'re not logged 🔥');
}

var decoded = jwt.decode(token);
console.log(chalk.bold('Email: ') + chalk.cyan(decoded.data.data.attributes.email));
