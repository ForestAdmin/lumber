#! /usr/bin/env node

//     __    _____ _____ _____ _____ _____
//    |  |  |  |  |     | __  |   __| __  |
//    |  |__|  |  | | | | __ -|   __|    -|
//    |_____|_____|_|_|_|_____|_____|__|__|

const program = require('commander');
const packagejson = require('./package.json');

program
  .version(packagejson.version)
  .command('generate <projectName>', 'generate a GraphQL API backend')
  .command('update', 'update your models\'s definition according to your database schema')
  .parse(process.argv);
