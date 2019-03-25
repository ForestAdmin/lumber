#! /usr/bin/env node

//     __    _____ _____ _____ _____ _____
//    |  |  |  |  |     | __  |   __| __  |
//    |  |__|  |  | | | | __ -|   __|    -|
//    |_____|_____|_|_|_|_____|_____|__|__|

const program = require('commander');
const packagejson = require('./package.json');
const dotenv = require('dotenv');

dotenv.load();

program
  .version(packagejson.version)
  .command('generate', 'generate your back office application based on your database schema')
  .command('update', 'update your models\'s definition according to your database schema')
  .command('deploy', 'deploy your back office application to production')
  .command('user', 'show your current logged user')
  .command('login', 'sign in to your Forest account')
  .command('logout', 'sign out of your Forest account')
  .parse(process.argv);
