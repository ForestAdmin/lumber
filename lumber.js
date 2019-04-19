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
  .command('update', 'update your models\'s definition according to your database schema')
  .command('install <package>', 'install a Lumber plugin')
  .command('run <plugin:cmd>', 'run a command from a Lumber plugin')
  .parse(process.argv);
