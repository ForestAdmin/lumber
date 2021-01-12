#! /usr/bin/env node

//     __    _____ _____ _____ _____ _____
//    |  |  |  |  |     | __  |   __| __  |
//    |  |__|  |  | | | | __ -|   __|    -|
//    |_____|_____|_|_|_|_____|_____|__|__|

const program = require('commander');
const packagejson = require('./package.json');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

program
  .version(packagejson.version)
  .command('generate <appName>', 'generate a backend application with an ORM/ODM configured')
  .command('login', 'log into Forest Admin API')
  .command('logout', 'log out from Forest Admin API')
  .command('update', 'update your project by generating files that does not currently exist')
  .parse(process.argv);
