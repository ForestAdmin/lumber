'use strict';
const _ = require('lodash');
const P = require('bluebird');
const program = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Github = require('./services/deploy/github');
const Heroku = require('./services/deploy/heroku');
const Forest = require('./services/deploy/forest');
const commandExists = require('command-exists');
const Netrc = require('netrc');
const logger = require('./services/logger');
const DB = require('./services/db');
const ProgressBar = require('progress');

let envConfig = {};

if (process.env.SERVER_HOST) {
  envConfig.serverHost = process.env.SERVER_HOST;
} else {
  envConfig.serverHost = 'https://forestadmin-server.herokuapp.com';
}

program
  .description('Deploy your admin to a remote environment')
  .option('-c, --connection-url', 'Enter the database credentials with a connection URL')
  .parse(process.argv);

console.log('ℹ︎ Are you ready to push your admin on production?\n');
console.log('ℹ︎ Requirements:');
console.log('ℹ︎ - Your admin project needs to be hosted on Github (private repo recommended).');
console.log('ℹ︎ - You must have a Heroku account (free) - https://signup.heroku.com');
console.log('ℹ︎ - You must have Heroku CLI installed - https://devcenter.heroku.com/articles/heroku-command-line#download-and-install\n');

let prompts = [];

if (process.env.GITHUB_REPO) {
  envConfig.githubRepo = process.env.GITHUB_REPO;
} else {
  prompts.push({
    type: 'input',
    name: 'githubRepo',
    message: 'What\'s the name of your project Github repository? (owner/repo)',
    validate: (githubRepo) => {
      if (githubRepo) {
        if (/.+\/.+/.test(githubRepo)) {
          return true;
        } else {
          return '🔥  Hey, the Github repository is not well formatted. Please, use the syntax owner/repo. 🔥';
        }
      } else {
        return '🔥  Hey, you need to specify your github repo 🔥';
      }
    }
  });
}

if (process.env.GITHUB_USERNAME) {
  envConfig.githubUsername = process.env.GITHUB_USERNAME;
} else {
  prompts.push({
    type: 'input',
    name: 'githubUsername',
    message: 'What\'s your Github username?',
    validate: (githubUsername) => {
      if (githubUsername) {
        return true;
      } else {
        return '🔥  Hey, you need to specify your github username 🔥';
      }
    }
  });
}

if (process.env.GITHUB_PASSWORD) {
  envConfig.githubPassword = process.env.GITHUB_PASSWORD;
} else {
  prompts.push({
    type: 'password',
    name: 'githubPassword',
    message: 'What\'s your Github password?',
    validate: (githubPassword) => {
      if (githubPassword) {
        return true;
      } else {
        return '🔥  Hey, you need to specify your github password 🔥';
      }
    }
  });
}

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
  message: 'Use a secure SSL database connection? ',
  default: true
});

commandExists('heroku', (err, commandExists) => {
  if (!commandExists) {
    logger.error('💀  Ouch, Heroku CLI is not installed 💀');
    logger.info('Please, install it: https://devcenter.heroku.com/articles/heroku-command-line#download-and-install');
    process.exit(1);
  }

  var netrc = new Netrc();
  if (!netrc['api.heroku.com']) {
    logger.error('💀  Ouch, you\'re not authenticated to Heroku yet. Please, run ' + chalk.bold('`heroku login`') + ' before. 💀');
    process.exit(1);
  }

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

          let bar = new ProgressBar('Deploying [:bar] :percent', {
            width: 50,
            total: 7
          });

          forest.setConfig(config);
          let github = new Github(config);
          let heroku = new Heroku(config);

          return new DB()
            .connect(config)
            .then(() => github.login())
            .then(() => bar.tick())
            .then(() => github.getRepoArchiveLink())
            .then((githubArchiveLink) => {
              bar.tick();
              return heroku
                .login()
                .thenReturn(githubArchiveLink);
            }, (err) => {
              if (err.code === 401) {
                bar.terminate();
                logger.error('💀  Oops, your Github credentials are not correct. 💀');
                process.exit(1);
              } else {
                throw err;
              }
            })
            .then((githubArchiveLink) => {
              bar.tick();
              return heroku.deployApp(githubArchiveLink);
            })
            .then((response) => {
              bar.tick();
              return {
                // jshint camelcase: false
                apiEndpoint: response.resolved_success_url.replace(/\/$/, ''),
                name: response.app.name
              };
            }, (err) => {
              bar.terminate();
              logger.error('💀  Oops, cannot deploy on your Heroku account.💀');
              if (err.response && err.response.text) {
                let errMsg = JSON.parse(err.response.text);
                if (errMsg) { logger.error(errMsg.message); }
              }

              process.exit(1);
            })
            .then((herokuResponse) => {
              bar.tick();
              return forest
                .login()
                .then(() => forest.createEnvironment(herokuResponse.apiEndpoint))
                .then((environment) => {
                  bar.tick();

                  return forest.updateDefaultEnvironment(environment)
                    .then(() => {
                      bar.tick();
                      return heroku.updateForestEnvSecret(herokuResponse.name,
                        environment.secretKey);
                    })
                    .then(() => forest.getRendering(environment))
                    .then((rendering) => {
                      bar.tick();
                      console.log(chalk.green('\n👍  Hooray, Deployment ' +
                        'success! 👍\n'));

                      console.log(chalk.cyan('🌳  Open your admin UI: ' +
                      `https://app.forestadmin.com/${rendering.id} 🌳`));
                    });
                });
            });
        });
    });
});
