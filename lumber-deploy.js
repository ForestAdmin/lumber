'use strict';
const _ = require('lodash');
const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Forest = require('./services/deploy/forest');
const commandExists = require('command-exists');
const Netrc = require('netrc');
const logger = require('./services/logger');
const DB = require('./services/db');
const ProgressBar = require('progress');
const KeyGenerator = require('./services/key-generator');

let envConfig = {};

if (process.env.SERVER_HOST) {
  envConfig.serverHost = process.env.SERVER_HOST;
} else {
  envConfig.serverHost = 'https://forestadmin-server.herokuapp.com';
}

program
  .description('Deploy your admin to your production environment')
  .option('-c, --connection-url', 'Enter the database credentials with a connection URL')
  .parse(process.argv);

console.log('ℹ︎ Are you ready to push your admin on production?\n');

let prompts = [];

if (program.connectionUrl) {
  prompts.push({
    type: 'input',
    name: 'dbConnectionUrl',
    message: 'What\'s your production database connection URL? ',
    validate: (dbConnectionUrl) => {
      if (dbConnectionUrl) {
        return true;
      } else {
        return '🔥  Hey, you need to specify the database connection URL 🔥';
      }
    }
  });
} else {
  prompts.push({
    type: 'list',
    name: 'dbDialect',
    message: 'What\'s your production database type? ',
    choices: ['postgres', 'mysql', 'mssql']
  });

  if (process.env.FOREST_DB_NAME) {
    envConfig.dbName = process.env.FOREST_DB_NAME;
  } else {
    prompts.push({
      type: 'input',
      name: 'dbName',
      message: 'What\'s the production database name?',
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
      message: 'What\'s the production database hostname?' ,
      validate: (dbHostname) => {
        if (dbHostname) {
          return true;
        } else {
          return '🔥  Hey, you need to specify the database hostname 🔥';
        }
      }
    });
  }

  if (process.env.FOREST_DB_PORT) {
    envConfig.dbPort = process.env.FOREST_DB_PORT;
  } else {
    prompts.push({
      type: 'input',
      name: 'dbPort',
      message: 'What\'s the production database port?',
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
      message: 'What\'s the production database user? ',
      default: 'root'
    });
  }

  if (process.env.FOREST_DB_PASSWORD) {
    envConfig.dbPassword = process.env.FOREST_DB_PASSWORD;
  } else {
    prompts.push({
      type: 'password',
      name: 'dbPassword',
      message: 'What\'s the production database password? [optional] '
    });
  }
}

prompts.push({
  type: 'confirm',
  name: 'dbSSL',
  message: 'Does your database require a SSL connection? ',
  default: true
});

prompts.push({
  type: 'input',
  name: 'appHostname',
  message: 'What\'s the hostname (or the IP) of your server (e.g: ec2-30-220-163-123.us-west-2.compute.amazonaws.com)',
  validate: (appHostname) => {
    if (appHostname) {
      return true;
    } else {
      return '🔥  Hey, you need to specify a hostname 🔥';
    }
  }
});

prompts.push({
  type: 'input',
  name: 'appPort',
  message: 'On which port your admin will be running?',
  default: 3000,
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

let forest = new Forest(envConfig);

return forest
  .login()
  .then(() => forest.getProjects(), () => {
    logger.error('💀  Ouch, you\'re not authenticated. Please, run ' +
      chalk.bold('`lumber login`') + ' before. 💀');
    process.exit(1);
  })
  .then((projects) => {
    return P.filter(projects, (project) => project.name);
  })
  .then((projects) => {
    prompts.unshift({
      type: 'list',
      name: 'projectName',
      message: 'Which project do you want to deploy? ',
      choices: projects.map((project) => project.name)
    });

    return inquirer.prompt(prompts)
      .then((config) => {
        config = _.merge(config, envConfig);

        config.project = _.find(projects, { name: config.projectName });
        config.prodEnv = _.find(config.project.environments, {
          type: 'production'
        });

        if (config.prodEnv) {
          return inquirer
            .prompt([{
              type: 'confirm',
              name: 'deleteOldProd',
              message: '⚠️  You already have a production environment ' +
                'configured. Are you sure you want to replace it? ⚠️',
              default: false
            }])
            .then((config2) => {
              if (config2.deleteOldProd) {
                return forest.deleteEnvironment(config.prodEnv);
              }
            })
            .then(() => config);
        } else {
          return new P((resolve) => resolve(config));
        }
      })
      .then((config) => {
        forest.setConfig(config);

        return forest.createEnvironment(`http://${config.appHostname}:${config.appPort}`)
          .then((environment) => {
            return new KeyGenerator()
              .generate()
              .then((authKey) => {
                console.log('1. Push your generated admin code to your custom server using SSH (scp), GIT, or anything else (without the node_modules/ directory).');
                console.log('2. Run `npm install`');
                console.log('3. Edit the `.env` file from the root folder of your admin code with the following content:');
                console.log(`
DATABASE_URL=${config.dbConnectionUrl}
FOREST_AUTH_SECRET=${authKey}
FOREST_ENV_SECRET=${environment.secretKey}
SSL_DATABASE=${config.dbSSL}
    `);

                console.log(chalk.bold('Run your admin microservice:'));

                console.log('4. Run your admin microservice: node ./bin/www');
                console.log('5. Refresh your browser, you can now switch to your production environment!');
                console.log('6. (Optional) Update the "DEFAULT ENVIRONMENT" settings on the UI to your new production environment.');
              });
          });
      });
  });

