const os = require('os');
const fs = require('fs');
const P = require('bluebird');
const chalk = require('chalk');
const inquirer = require('inquirer');
const api = require('./api');
const { parseJwt } = require('../utils/authenticator-helper');
const { EMAIL_REGEX, PASSWORD_REGEX } = require('../utils/regexs');
const logger = require('./logger');

function Authenticator() {
  this.pathToLumberrc = `${os.homedir()}/.lumberrc`;

  this.saveToken = token => fs.writeFileSync(this.pathToLumberrc, token);

  this.isTokenCorrect = (email, token) => {
    const sessionInfo = parseJwt(token);
    if (sessionInfo) {
      if ((sessionInfo.exp * 1000) <= Date.now()) {
        logger.warn('Your token has expired.');
        return false;
      }

      if (sessionInfo.data.data.attributes.email === email) {
        return true;
      }
      logger.warn('Your token is invalid.');
    }
    return false;
  };

  this.login = async (email, password) => {
    const sessionToken = await api.login(email, password);
    this.saveToken(sessionToken);
    return sessionToken;
  };

  this.loginWithGoogle = async (email) => {
    const endpoint = process.env.FOREST_URL && process.env.FOREST_URL.includes('localhost')
      ? 'http://localhost:4200' : 'https://app.forestadmin.com';
    const url = chalk.cyan.underline(`${endpoint}/authentication-token`);
    logger.info(`To authentify with your google account please follow this link and copy the authentication token: ${url}`);
    const { sessionToken } = await inquirer.prompt([{
      type: 'password',
      name: 'sessionToken',
      message: 'Enter your Forest Admin authentication token:',
      validate: (input) => {
        const errorMessage = 'Invalid token. Please enter your authentication token.';
        if (!input) { return errorMessage; }

        const sessionInfo = parseJwt(input);
        if (sessionInfo
          && sessionInfo.data.data.attributes.email === email
          && (sessionInfo.exp * 1000) <= Date.now()) {
          return true;
        }
        return errorMessage;
      },
    }]);
    this.saveToken(sessionToken);
    return sessionToken;
  };

  this.logout = async () => new P((resolve, reject) => {
    fs.stat(this.pathToLumberrc, (err) => {
      if (err === null) {
        fs.unlinkSync(this.pathToLumberrc);

        resolve(true);
      } else if (err.code === 'ENOENT') {
        logger.info('Your were not logged in');

        resolve(false);
      } else {
        reject(err);
      }
    });
  });

  this.loginWithEmailOrTokenArgv = async (config) => {
    try {
      const { email, token } = config;
      let { password } = config;

      if (token && this.isTokenCorrect(email, token)) {
        return token;
      }

      const isGoogleAccount = await api.isGoogleAccount(email);
      if (isGoogleAccount) {
        return this.loginWithGoogle(email);
      }

      if (!password) {
        ({ password } = await inquirer.prompt([{
          type: 'password',
          name: 'password',
          message: 'What\'s your Forest Admin password:',
          validate: (input) => {
            if (input) { return true; }
            return 'Please enter your password.';
          },
        }]));
      }

      return await this.login(email, password);
    } catch (error) {
      if (error.message === 'Unauthorized') {
        logger.error('Incorrect email or password.');
      } else {
        logger.error(`An unexpected error occured. Please create a Github issue with following error: ${chalk.red(error)}`);
      }

      process.exit(1);
    }

    return null;
  };

  this.createAccount = async () => {
    logger.info('Create an account:');
    const authConfig = await inquirer.prompt([{
      type: 'input',
      name: 'firstName',
      message: 'What\'s your first name?',
      validate: (input) => {
        if (input) { return true; }
        return 'Please enter your first name.';
      },
    }, {
      type: 'input',
      name: 'lastName',
      message: 'What\'s your last name?',
      validate: (input) => {
        if (input) { return true; }
        return 'Please enter your last name.';
      },
    }, {
      type: 'input',
      name: 'email',
      message: 'What\'s your email address?',
      validate: (input) => {
        if (EMAIL_REGEX.test(input)) { return true; }
        return input ? 'Invalid email' : 'Please enter your email address.';
      },
    }, {
      type: 'password',
      name: 'password',
      message: 'Choose a password:',
      validate: (password) => {
        if (password) {
          if (PASSWORD_REGEX.test(password)) { return true; }
          return `🔓  Your password security is too weak 🔓\n
          \tPlease make sure it contains at least:\n
          \t> 8 characters\n
          \t> Upper and lower case letters\n
          \t> Numbers`;
        }

        return 'Please, choose a password.';
      },
    }]);

    try {
      await api.createUser(authConfig);
    } catch (error) {
      if (error.message === 'Conflict') {
        logger.error(`Your account already exists. Please, use the command ${chalk.cyan('lumber run lumber-forestadmin:login')}.`);
      } else {
        logger.error(`An unexpected error occured. Please create a Github issue with following error: ${chalk.red(error)}`);
      }

      process.exit(1);
    }

    const token = await this.login(authConfig.email, authConfig.password);
    logger.success('\nAccount successfully created.\n');

    return token;
  };

  this.loginFromCommandLine = async (config) => {
    const { email, token } = config;
    let sessionToken;
    try {
      sessionToken = token || fs.readFileSync(this.pathToLumberrc, { encoding: 'utf8' });
      if (!sessionToken && email) {
        throw new Error();
      }

      if (email && !this.isTokenCorrect(email, sessionToken)) {
        throw new Error();
      }
    } catch (error) {
      if (email) {
        return this.loginWithEmailOrTokenArgv(config);
      }
      return this.createAccount();
    }

    this.saveToken(sessionToken);
    return sessionToken;
  };
}

module.exports = Authenticator;
