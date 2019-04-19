const _ = require('lodash');
const inquirer = require('inquirer');
const authenticator = require('../services/authenticator');
const expandHomeDir = require('expand-home-dir');
const path = require('path');
const logger = require('./logger');

const FORMAT_PASSWORD = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{8,}$/;

async function Prompter(program, requests) {
  function isRequested(option) {
    return requests.indexOf(option) > -1;
  }

  const envConfig = { db: program.db };

  if (process.env.FOREST_URL) {
    envConfig.serverHost = process.env.FOREST_URL;
  } else {
    envConfig.serverHost = 'https://api.forestadmin.com';
  }

  if (program.sourceDirectory) {
    envConfig.sourceDirectory = program.sourceDirectory;
  } else {
    envConfig.sourceDirectory = process.cwd();
  }

  const prompts = [];

  if (isRequested('dbConnectionUrl')) {
    envConfig.dbConnectionUrl = program.connectionUrl || process.env.DATABASE_URL;

    try {
      [, envConfig.dbDialect] = envConfig.dbConnectionUrl.match(/(.*):\/\//);
    } catch (error) {
      logger.error('Cannot parse the database dialect. Please, check the syntax of the database connection string.');
      process.exit(1);
    }
  }

  if (isRequested('dbDialect')) {
    if (process.env.FOREST_DB_DIALECT) {
      envConfig.dbDialect = process.env.FOREST_DB_DIALECT;
    } else {
      prompts.push({
        type: 'list',
        name: 'dbDialect',
        message: 'What\'s the database type? ',
        choices: ['postgres', 'mysql', 'mssql', 'mongodb'],
      });

      // NOTICE: use a rawlist on Windows because of this issue:
      // https://github.com/SBoudrias/Inquirer.js/issues/303
      if (/^win/.test(process.platform)) {
        prompts[0].type = 'rawlist';
      }
    }
  }

  if (isRequested('dbName')) {
    if (process.env.FOREST_DB_NAME) {
      envConfig.dbName = process.env.FOREST_DB_NAME;
    } else {
      prompts.push({
        type: 'input',
        name: 'dbName',
        message: 'What\'s the database name?',
        when: answers => answers.dbDialect !== 'sqlite',
        validate: (dbName) => {
          if (dbName) { return true; }
          return 'Please specify the database name.';
        },
      });
    }
  }

  if (isRequested('dbSchema')) {
    if (process.env.DATABASE_SCHEMA) {
      envConfig.dbSchema = process.env.DATABASE_SCHEMA;
    } else {
      prompts.push({
        type: 'input',
        name: 'dbSchema',
        message: 'What\'s the database schema? [optional]',
        description: 'Leave blank by default',
        when: answers => answers.dbDialect !== 'sqlite' && answers.dbDialect !== 'mongodb',
        default: (args) => {
          if (args.dbDialect === 'postgres') { return 'public'; }
          return '';
        },
      });
    }
  }

  if (isRequested('dbHostname')) {
    if (process.env.FOREST_DB_HOSTNAME) {
      envConfig.dbHostname = process.env.FOREST_DB_HOSTNAME;
    } else {
      prompts.push({
        type: 'input',
        name: 'dbHostname',
        message: 'What\'s the database hostname?',
        when: answers => answers.dbDialect !== 'sqlite',
        default: 'localhost',
      });
    }
  }

  if (isRequested('dbPort')) {
    if (process.env.FOREST_DB_PORT) {
      envConfig.dbPort = process.env.FOREST_DB_PORT;
    } else {
      prompts.push({
        type: 'input',
        name: 'dbPort',
        message: 'What\'s the database port?',
        when: answers => answers.dbDialect !== 'sqlite',
        default: (args) => {
          if (args.dbDialect === 'postgres') {
            return '5432';
          } else if (args.dbDialect === 'mysql') {
            return '3306';
          } else if (args.dbDialect === 'mssql') {
            return '1433';
          } else if (args.dbDialect === 'mongodb') {
            return '27017';
          }

          return undefined;
        },
        validate: (port) => {
          if (!/^\d+$/.test(port)) {
            return 'The port must be a number.';
          }

          const parsedPort = parseInt(port, 10);
          if (parsedPort > 0 && parsedPort < 65536) { return true; }
          return 'This is not a valid port.';
        },
      });
    }
  }

  if (isRequested('dbUser')) {
    if (process.env.FOREST_DB_USER) {
      envConfig.dbUser = process.env.FOREST_DB_USER;
    } else {
      prompts.push({
        type: 'input',
        name: 'dbUser',
        message: 'What\'s the database user? ',
        when: answers => answers.dbDialect !== 'sqlite',
        default: (args) => {
          if (args.dbDialect === 'mongodb') {
            return undefined;
          }

          return 'root';
        },
      });
    }
  }

  if (isRequested('dbPassword')) {
    if (process.env.FOREST_DB_PASSWORD) {
      envConfig.dbPassword = process.env.FOREST_DB_PASSWORD;
    } else {
      prompts.push({
        type: 'password',
        name: 'dbPassword',
        when: answers => answers.dbDialect !== 'sqlite',
        message: 'What\'s the database password? [optional] ',
      });
    }
  }

  if (isRequested('ssl')) {
    if (process.env.FOREST_DB_SSL) {
      envConfig.ssl = JSON.parse(process.env.FOREST_DB_SSL.toLowerCase());
    } else {
      prompts.push({
        type: 'confirm',
        name: 'ssl',
        message: 'Does your database require a SSL connection? ',
        when: answers => answers.dbDialect !== 'sqlite',
        default: false,
      });
    }
  }

  if (isRequested('mongodbSrv')) {
    if (process.env.FOREST_DB_MONGODB_SRV) {
      envConfig.mongodbSrv = process.env.FOREST_MONGODB_SRV;
    } else {
      prompts.push({
        type: 'confirm',
        name: 'mongodbSrv',
        message: 'Use a SRV connection string? ',
        when: answers => answers.dbDialect === 'mongodb',
        default: false,
      });
    }
  }

  if (isRequested('dbStorage')) {
    if (process.env.FOREST_STORAGE) {
      envConfig.dbStorage = process.env.FOREST_STORAGE;
    } else {
      prompts.push({
        type: 'input',
        name: 'dbStorage',
        when: answers => answers.dbDialect === 'sqlite',
        message: 'What\'s the full path of your SQLite file?',
        validate: (dbStorage) => {
          if (dbStorage) { return true; }
          return 'Please specify a database SQLite file.';
        },
      });
    }
  }

  if (isRequested('appHostname')) {
    if (process.env.FOREST_HOSTNAME) {
      envConfig.appHostname = process.env.FOREST_HOSTNAME;
    } else {
      prompts.push({
        type: 'input',
        name: 'appHostname',
        message: 'What\'s the IP/hostname on which your application will be running? ',
        default: 'localhost',
      });
    }
  }

  if (isRequested('appPort')) {
    if (process.env.FOREST_PORT) {
      envConfig.appPort = process.env.FOREST_PORT;
    } else {
      prompts.push({
        type: 'input',
        name: 'appPort',
        message: 'What\'s the port on which your application will be running? ',
        default: '3000',
        validate: (port) => {
          if (!/^\d+$/.test(port)) {
            return 'The port must be a number.';
          }

          const parsedPort = parseInt(port, 10);
          if (parsedPort > 0 && parsedPort < 65536) { return true; }
          return 'This is not a valid port.';
        },
      });
    }
  }

  if (isRequested('appName')) {
    if (!program.args[0]) {
      logger.error(
        'Missing project name in the command.',
        'Please specify a project name. Type lumber help for more information.',
      );
      process.exit(1);
    } else {
      [envConfig.appName] = program.args;
    }
  }

  if (isRequested('email')) {
    if (!envConfig.authToken) {
      prompts.push({
        type: 'input',
        name: 'email',
        message: 'What\'s your email address? ',
        validate: (email) => {
          if (email) { return true; }
          return 'Please enter your email address.';
        },
      });
    }
  }

  if (isRequested('passwordCreate')) {
    if (!envConfig.authToken) {
      prompts.push({
        type: 'password',
        name: 'password',
        message: 'Choose a password: ',
        validate: (password) => {
          if (password) {
            if (FORMAT_PASSWORD.test(password)) { return true; }
            return '🔓  Your password security is too weak 🔓\n' +
            ' Please make sure it contains at least:\n' +
            '    > 8 characters\n' +
            '    > Upper and lower case letters\n' +
            '    > Numbers';
          }

          return 'Your password cannot be blank.';
        },
      });
    }
  }

  if (isRequested('password')) {
    prompts.push({
      type: 'password',
      name: 'password',
      message: 'What\'s your password: ',
      validate: (password) => {
        if (password) { return true; }
        return 'Your password cannot be blank.';
      },
    });
  }

  envConfig.authToken = authenticator.getAuthToken();

  const config = await inquirer.prompt(prompts);

  // NOTICE: Remove the dbPassword if there's no password for the DB
  // connection.
  if (!config.dbPassword) { delete config.dbPassword; }

  // NOTICE: Expand the dbStorage ~ path.
  if (config.dbStorage) {
    config.dbStorage = expandHomeDir(config.dbStorage);
    config.dbStorage = path.resolve(config.dbStorage);
  }

  return _.merge(config, envConfig);
}

module.exports = Prompter;
