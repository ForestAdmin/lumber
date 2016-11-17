#! /usr/bin/env node
'use strict';

//     __    _____ _____ _____ _____ _____
//    |  |  |  |  |     | __  |   __| __  |
//    |  |__|  |  | | | | __ -|   __|    -|
//    |_____|_____|_|_|_|_____|_____|__|__|


const program = require('commander');
const packagejson = require('./package.json');

program
  .version(packagejson.version)
  .command('generate', 'generate your admin microservice')
  .command('heroku-deploy', 'deploy your admin to a remote environment')
  .command('action', 'create a new action')
  .command('user', 'show your current logged user')
  .command('login', 'sign in to your account')
  .command('logout', 'sign out of your account')
  .parse(process.argv);
