const eventSender = require('../event-sender');
const logger = require('../logger');
const PromptUtils = require('./prompt-utils');

class DatabasePrompts extends PromptUtils {
  constructor(program, envConfig, prompts, requests) {
    super(requests);
    this.program = program;
    this.envConfig = envConfig;
    this.prompts = prompts;
  }

  async handlePrompts() {
    await this.handleConnectionUrl();
    this.handleDialect();
    this.handleName();
    this.handleSchema();
    this.handleHostname();
    this.handlePort();
    this.handleUser();
    this.handlePassword();
    this.handleSsl();
    this.handleMongodbSrv();
  }

  async handleConnectionUrl() {
    if (this.isOptionRequested('dbConnectionUrl')) {
      this.envConfig.dbConnectionUrl = this.program.connectionUrl;

      try {
        [, this.envConfig.dbDialect] = this.envConfig.dbConnectionUrl.match(/(.*):\/\//);
        if (this.envConfig.dbDialect === 'mongodb+srv') { this.envConfig.dbDialect = 'mongodb'; }
      } catch (error) {
        const message = 'Cannot parse the database dialect. Please, check the syntax of the database connection string.';
        logger.error(message);
        await eventSender.notifyError('unknown_error', message);
        process.exit(1);
      }
    }
  }

  handleDialect() {
    if (this.isOptionRequested('dbDialect')) {
      const prompt = {
        type: 'list',
        name: 'dbDialect',
        message: 'What\'s the database type? ',
        choices: ['postgres', 'mysql', 'mssql', 'mongodb'],
      };

      // NOTICE: use a rawlist on Windows because of this issue:
      // https://github.com/SBoudrias/Inquirer.js/issues/303
      if (/^win/.test(process.platform)) {
        prompt.type = 'rawlist';
      }

      this.prompts.push(prompt);
    }
  }

  handleName() {
    if (this.isOptionRequested('dbName')) {
      this.prompts.push({
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

  handleSchema() {
    if (this.isOptionRequested('dbSchema')) {
      this.envConfig.dbSchema = this.program.schema;
      if (!this.envConfig.dbSchema) {
        this.prompts.push({
          type: 'input',
          name: 'dbSchema',
          message: 'What\'s the database schema? [optional]',
          description: 'Leave blank by default',
          when: (answers) => {
            // NOTICE: MongoDB, MySQL and SQLite do not require a Schema.
            const skipDatabases = ['sqlite', 'mongodb', 'mysql'];
            return !skipDatabases.includes(answers.dbDialect || this.envConfig.dbDialect);
          },
          default: (args) => {
            if (args.dbDialect === 'postgres') { return 'public'; }
            return '';
          },
        });
      }
    }
  }

  handleHostname() {
    if (this.isOptionRequested('dbHostname')) {
      this.prompts.push({
        type: 'input',
        name: 'dbHostname',
        message: 'What\'s the database hostname?',
        when: answers => answers.dbDialect !== 'sqlite',
        default: 'localhost',
      });
    }
  }

  handlePort() {
    if (this.isOptionRequested('dbPort')) {
      this.prompts.push({
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

  handleUser() {
    if (this.isOptionRequested('dbUser')) {
      this.prompts.push({
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

  handlePassword() {
    if (this.isOptionRequested('dbPassword')) {
      this.prompts.push({
        type: 'password',
        name: 'dbPassword',
        when: answers => answers.dbDialect !== 'sqlite',
        message: 'What\'s the database password? [optional]',
      });
    }
  }

  handleSsl() {
    if (this.isOptionRequested('ssl')) {
      const { ssl } = this.program;
      if (ssl) {
        try {
          // NOTICE: Parse from string (e.g "true" or "false") to boolean.
          this.envConfig.ssl = JSON.parse(ssl.toLowerCase());
          if (typeof this.envConfig.ssl !== 'boolean') {
            throw new Error();
          }
        } catch (e) {
          logger.error(`Database SSL value must be either "true" or "false" ("${ssl}" given).`);
          process.exit(1);
        }
      } else {
        this.prompts.push({
          type: 'confirm',
          name: 'ssl',
          message: 'Does your database require a SSL connection? ',
          when: answers => answers.dbDialect !== 'sqlite',
          default: false,
        });
      }
    }
  }

  handleMongodbSrv() {
    if (this.isOptionRequested('mongodbSrv')) {
      this.prompts.push({
        type: 'confirm',
        name: 'mongodbSrv',
        message: 'Use a SRV connection string? ',
        when: answers => answers.dbDialect === 'mongodb',
        default: false,
      });
    }
  }
}

module.exports = DatabasePrompts;
