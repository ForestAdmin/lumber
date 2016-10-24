#! /usr/bin/env node
'use strict';

//     __    _____ _____ _____ _____ _____
//    |  |  |  |  |     | __  |   __| __  |
//    |  |__|  |  | | | | __ -|   __|    -|
//    |_____|_____|_|_|_|_____|_____|__|__|


const program = require('commander');

program
  .version('1.0.1')
  .command('generate', 'generate your admin microservice')
  .command('action', 'create a new action')
  .command('user', 'show your current logged user')
  .command('login', 'sign in to your account')
  .command('logout', 'sign out of your account')
  .parse(process.argv);
