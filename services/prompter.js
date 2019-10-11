const _ = require('lodash');
const inquirer = require('inquirer');
const expandHomeDir = require('expand-home-dir');
const path = require('path');
const chalk = require('chalk');
const logger = require('./logger');
const eventSender = require('./event-sender');
const DirectoryExistenceChecker = require('./directory-existence-checker');

const FORMAT_PASSWORD = /^(?=\S*?[A-Z])(?=\S*?[a-z])((?=\S*?[0-9]))\S{8,}$/;

async function Prompter(program, requests) {
  function isRequested(option) {
    return requests.indexOf(option) > -1;
  }

  const envConfig = { db: program.db };

  if (program.sourceDirectory) {
    envConfig.sourceDirectory = program.sourceDirectory;
  } else {
    envConfig.sourceDirectory = process.cwd();
  }

  const prompts = [];

  if (isRequested('appName')) {
    if (!program.args[0]) {
      logger.error(
        'Missing project name in the command.',
        'Please specify a project name. Type lumber help for more information.',
      );
      process.exit(1);
    } else if (new DirectoryExistenceChecker(process.cwd(), program.args[0]).perform()) {
      const message = `The directory ${chalk.red(`${process.cwd()}/${program.args[0]}`)} already exists.`;
      logger.error(
        message,
        'Please retry with another project name.',
      );
      await eventSender.notifyError('unknown_error', message);
      process.exit(1);
    } else {
      [envConfig.appName] = program.args;
    }
  }

  if (isRequested('dbConnectionUrl')) {
    envConfig.dbConnectionUrl = program.connectionUrl || process.env.DATABASE_URL;

    try {
      [, envConfig.dbDialect] = envConfig.dbConnectionUrl.match(/(.*):\/\//);
      if (envConfig.dbDialect === 'mongodb+srv') { envConfig.dbDialect = 'mongodb'; }
    } catch (error) {
      const message = 'Cannot parse the database dialect. Please, check the syntax of the database connection string.';
      logger.error(message);
      await eventSender.notifyError('unknown_error', message);
      process.exit(1);
    }
  }

  if (isRequested('dbDialect')) {
    if (process.env.DATABASE_DIALECT) {
      envConfig.dbDialect = process.env.DATABASE_DIALECT;
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
    if (process.env.DATABASE_NAME) {
      envConfig.dbName = process.env.DATABASE_NAME;
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
        when: answers => answers.dbDialect !== 'sqlite' && answers.dbDialect !== 'mongodb' && envConfig.dbDialect !== 'mongodb',
        default: (args) => {
          if (args.dbDialect === 'postgres') { return 'public'; }
          return '';
        },
      });
    }
  }

  if (isRequested('dbHostname')) {
    if (process.env.DATABASE_HOST) {
      envConfig.dbHostname = process.env.DATABASE_HOST;
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
    if (process.env.DATABASE_PORT) {
      envConfig.dbPort = process.env.DATABASE_PORT;
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
    if (process.env.DATABASE_USER) {
      envConfig.dbUser = process.env.DATABASE_USER;
    } else {
      prompts.push({
        type: 'input',
        name: 'dbUser',
        message: 'What\'s the database user?',
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
    if (process.env.DATABASE_PASSWORD) {
      envConfig.dbPassword = process.env.DATABASE_PASSWORD;
    } else {
      prompts.push({
        type: 'password',
        name: 'dbPassword',
        when: answers => answers.dbDialect !== 'sqlite',
        message: 'What\'s the database password? [optional]',
      });
    }
  }

  if (isRequested('ssl')) {
    if (process.env.DATABASE_SSL) {
      envConfig.ssl = JSON.parse(process.env.DATABASE_SSL.toLowerCase());
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
    if (process.env.DATABASE_MONGODB_SRV) {
      envConfig.mongodbSrv = JSON.parse(process.env.DATABASE_MONGODB_SRV.toLowerCase());
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

  if (isRequested('appHostname')) {
    if (process.env.APPLICATION_HOST) {
      envConfig.appHostname = process.env.APPLICATION_HOST;
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
    if (process.env.APPLICATION_PORT) {
      envConfig.appPort = process.env.APPLICATION_PORT;
    } else {
      prompts.push({
        type: 'input',
        name: 'appPort',
        message: 'What\'s the port on which your application will be running? ',
        default: '3310',
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
