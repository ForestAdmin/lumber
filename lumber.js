#! /usr/bin/env node

//     __    _____ _____ _____ _____ _____
//    |  |  |  |  |     | __  |   __| __  |
//    |  |__|  |  | | | | __ -|   __|    -|
//    |_____|_____|_|_|_|_____|_____|__|__|

const program = require('commander');
const packagejson = require('./package.json');

program
  .version(packagejson.version)
  .command('generate <appName>', 'generate a backend application with an ORM/ODM configured')
  .command('update', 'update your models')
  .command('login', 'log into Forest Admin API')
  .command('logout', 'log out from Forest Admin API')
  .parse(process.argv);
