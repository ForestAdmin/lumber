'use strict';
const _ = require('lodash');
const fs = require('fs');
const P = require('bluebird');
const program = require('commander');
const spawn = require('child_process').spawn;
const chalk = require('chalk');
const inquirer = require('inquirer');
const DB = require('./services/db');
const TableAnalyzer = require('./services/table-analyzer');
const Dumper = require('./services/dumper');
const authenticator = require('./services/authenticator');

function isDirectoryExist(path) {
  try {
    fs.accessSync(path, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

program
  .description('Generate an admin microservice that serves a REST API hooked directly into your database.')
  .option('-s, --ssl', 'Enable SSL database connection')
  .option('-c, --connection-url', 'Enter the database credentials with a connection URL')
  .parse(process.argv);

console.log('ℹ︎  Enter your database connection details and then your admin interface will be automatically generated.');
console.log('ℹ︎  Your database credentials are safe. They are only stored in the Lumber generated microservice.\n');

let envConfig = { ssl: program.ssl };

if (process.env.SERVER_HOST) {
  envConfig.serverHost = process.env.SERVER_HOST;
} else {
  envConfig.serverHost = 'https://forestadmin-server.herokuapp.com';
}

let prompts = [{
  type: 'list',
  name: 'dbDialect',
  message: 'What\'s the database type? ',
  choices: ['postgres', 'mysql', 'mssql']
}];

// NOTICE: use a rawlist on Windows because of this issue:
// https://github.com/SBoudrias/Inquirer.js/issues/303
if (/^win/.test(process.platform)) {
  prompts[0].type = 'rawlist';
}

if (process.env.FOREST_DB_NAME) {
  envConfig.dbName = process.env.FOREST_DB_NAME;
} else {
  prompts.push({
    type: 'input',
    name: 'dbName',
    message: 'What\'s the database name?',
    validate: (dbName) => {
      if (dbName) {
        return true;
      } else {
        return '🔥  Hey, you need to specify the database name 🔥';
      }
    }
  });
}

if (process.env.FOREST_DB_HOSTNAME) {
  envConfig.dbHostname = process.env.FOREST_DB_HOSTNAME;
} else {
  prompts.push({
    type: 'input',
    name: 'dbHostname',
    message: 'What\'s the database hostname?' ,
    default: 'localhost'
  });
}

if (process.env.FOREST_DB_PORT) {
  envConfig.dbPort = process.env.FOREST_DB_PORT;
} else {
  prompts.push({
    type: 'input',
    name: 'dbPort',
    message: 'What\'s the database port?',
    default: (args) => {
      if (args.dbDialect === 'postgres') {
        return '5432';
      } else if (args.dbDialect === 'mysql') {
        return '3306';
      } else if (args.dbDialect === 'mssql') {
        return '1433';
      }
    },
    validate: (port) => {
      if (!/^\d+$/.test(port)) {
        return '🔥  Oops, the port must be a number 🔥';
      }

      port = parseInt(port, 10);
      if (port > 0 && port < 65536) {
        return true;
      } else {
        return '🔥  Oops, this is not a valid port 🔥';
      }
    }
  });
}

if (process.env.FOREST_DB_USER) {
  envConfig.dbUser = process.env.FOREST_DB_USER;
} else {
  prompts.push({
    type: 'input',
    name: 'dbUser',
    message: 'What\'s the database user? ',
    default: 'root'
  });
}

if (process.env.FOREST_DB_PASSWORD) {
  envConfig.dbPassword = process.env.FOREST_DB_PASSWORD;
} else {
  prompts.push({
    type: 'password',
    name: 'dbPassword',
    message: 'What\'s the database password? [optional] '
  });
}

if (process.env.FOREST_PROJECT) {
  envConfig.appName = process.env.FOREST_PROJECT;
} else {
  prompts.push({
    type: 'input',
    name: 'appName',
    message: 'Choose a project name: ',
    validate: (projectName) => {
      if (projectName) {
        if (/^([A-Za-z0-9-_]+)$/.test(projectName)) {
          return true;
        } else {
          return '🔥  The project name should only contains alphanumeric, ' +
            'dash and underscore characters. 🔥';
        }
      } else {
        return '🔥  Please, choose a project name 🔥';
      }
    }
  });
}

envConfig.authToken = authenticator.getAuthToken();
if (!envConfig.authToken) {
  prompts.push({
    type: 'input',
    name: 'email',
    message: 'What\'s your email address? ',
    validate: (email) => {
      if (email) {
        return true;
      } else {
        return '🔥  Please enter your email address 🔥';
      }
    }
  });

  prompts.push({
    type: 'password',
    name: 'password',
    message: 'Choose a password: ',
    validate: (password) => {
      if (password) {
        return true;
      } else {
        return '🔥  Oops, your password cannot be blank 🔥';
      }
    }
  });
}

inquirer.prompt(prompts).then((config) => {
  config = _.merge(config, envConfig);

  // NOTICE: Remove the dbPassword if there's no password for the DB
  // connection.
  if (!config.dbPassword) { delete config.dbPassword; }

  // NOTICE: Ensure the project directory doesn't exist yet.
  let path = `${process.cwd()}/${config.appName}`;
  if (isDirectoryExist(path)) {
    console.log(`💀  Oops, the directory ${path} already exists.💀`);
    process.exit(1);
  }

  return new DB()
    .connect(config)
    .then((db) => {
      let queryInterface = db.getQueryInterface();
      let tableAnalyzer = new TableAnalyzer(queryInterface, config);
      let schema = {};

      return P
        .map(queryInterface.showAllTables(), (table) => {
          // NOTICE: MS SQL returns objects instead of strings.
          if (typeof table === 'object') { table = table.tableName; }

          return tableAnalyzer
            .analyzeTable(table)
            .spread((fields, references) => {
              schema[table] = { fields: fields, references: references };
            });
        })
        .then(() => {
          if (config.authToken) {
            return authenticator.createProject(config);
          } else {
            return authenticator.register(config);
          }
        })
        .then((project) => {
          let dumper = new Dumper(project, config);
          return P.each(Object.keys(schema), (table) => {
            return dumper.dump(table, schema[table].fields,
              schema[table].references);
          });
        });
    })
    .then(() => {
      console.log(chalk.green(`\ncd ${config.appName} && npm install...`));
      let cmd = spawn('npm', [
        'install', `--prefix=${config.appName}`, '--progress=true'
      ], {
        stdio: 'inherit',
        stderr: 'inherit',
        shell: true
      });

      cmd.on('close', (code) => {
        if (!code) {
          console.log(chalk.green('\n👍  Hooray, installation ' +
            'success! 👍\n'));

          console.log(chalk.bold('Run your admin microservice:'));
          console.log('$ ' +
            chalk.cyan(`cd "${config.appName}" && node ./bin/www\n`));

          process.exit(0);
        } else {
          console.log('💀  Oops, NPM installation failed. Please, ' +
            'try it manually to have more info 💀\n');
          process.exit(1);
        }
      });
    });
});
