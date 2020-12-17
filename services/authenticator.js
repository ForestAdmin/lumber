const { EMAIL_REGEX, PASSWORD_REGEX } = require('../utils/regexs');
const { ERROR_UNEXPECTED } = require('../utils/messages');

function validatePassword(password) {
  if (password) {
    if (PASSWORD_REGEX.test(password)) { return true; }
    return `🔓  Your password security is too weak 🔓\n
Please make sure it contains at least:\n
  > 8 characters\n
  > Upper and lower case letters\n
  > Numbers`;
  }

  return 'Please, choose a password.';
}

class Authenticator {
  /**
   * @param {import('../context/init').Context} context
   */
  constructor({
    logger, fs, os, chalk, api, terminator, authenticatorHelper,
    inquirer, fsAsync, applicationTokenService,
  }) {
    this.logger = logger;
    this.fs = fs;
    this.fsAsync = fsAsync;
    this.os = os;
    this.chalk = chalk;
    this.api = api;
    this.terminator = terminator;
    this.authenticatorHelper = authenticatorHelper;
    this.inquirer = inquirer;
    this.applicationTokenService = applicationTokenService;

    ['logger', 'fs', 'os', 'chalk',
      'api', 'terminator', 'authenticatorHelper',
      'inquirer', 'fsAsync', 'applicationTokenService',
    ].forEach((name) => {
      if (!this[name]) throw new Error(`Missing dependency ${name}`);
    });

    this.pathToLumberrc = `${os.homedir()}/.lumberrc`;
  }

  saveToken(token) {
    return this.fs.writeFileSync(this.pathToLumberrc, token);
  }

  isTokenCorrect(email, token) {
    const sessionInfo = this.authenticatorHelper.parseJwt(token);
    if (sessionInfo) {
      if ((sessionInfo.exp * 1000) <= Date.now()) {
        this.logger.warn('Your token has expired.');
        return false;
      }

      if (sessionInfo.data.data.attributes.email === email) {
        return true;
      }
      this.logger.warn('Your credentials are invalid.');
    }
    return false;
  }

  async login(email, password) {
    const sessionToken = await this.api.login(email, password);
    this.saveToken(sessionToken);
    return sessionToken;
  }

  async loginWithGoogle(email) {
    const endpoint = process.env.FOREST_URL && process.env.FOREST_URL.includes('localhost')
      ? 'http://localhost:4200' : 'https://app.forestadmin.com';
    const url = this.chalk.cyan.underline(`${endpoint}/authentication-token`);
    this.logger.info(`To authenticate with your Google account, please follow this link and copy the authentication token: ${url}`);

    this.logger.pauseSpinner();
    const { sessionToken } = await this.inquirer.prompt([{
      type: 'password',
      name: 'sessionToken',
      message: 'Enter your Forest Admin authentication token:',
      validate: (input) => {
        const errorMessage = 'Invalid token. Please enter your authentication token.';
        if (!input) { return errorMessage; }

        const sessionInfo = this.authenticatorHelper.parseJwt(input);
        if (sessionInfo
          && sessionInfo.data.data.attributes.email === email
          && (sessionInfo.exp * 1000) > Date.now()) {
          return true;
        }
        return errorMessage;
      },
    }]);
    this.logger.continueSpinner();
    this.saveToken(sessionToken);
    return sessionToken;
  }

  async logout() {
    try {
      await this.fsAsync.stat(this.pathToLumberrc);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('You were not logged in');
        return;
      }

      throw error;
    }

    const token = await this.fsAsync.readFile(this.pathToLumberrc, { encoding: 'utf8' });

    try {
      if (token) {
        await this.applicationTokenService.deleteApplicationToken(token.trim());
      }
    } finally {
      await this.fsAsync.unlink(this.pathToLumberrc);
    }
  }

  async loginWithEmailOrTokenArgv(config) {
    try {
      const { email, token } = config;
      let { password } = config;

      if (token && this.isTokenCorrect(email, token)) {
        return token;
      }

      const isGoogleAccount = await this.api.isGoogleAccount(email);
      if (isGoogleAccount) {
        return this.loginWithGoogle(email);
      }

      if (!password) {
        this.logger.pauseSpinner();
        ({ password } = await this.inquirer.prompt([{
          type: 'password',
          name: 'password',
          message: 'What\'s your Forest Admin password:',
          validate: (input) => {
            if (input) { return true; }
            return 'Please enter your password.';
          },
        }]));
        this.logger.continueSpinner();
      }

      return await this.login(email, password);
    } catch (error) {
      const message = error.message === 'Unauthorized'
        ? 'Incorrect email or password.'
        : `${ERROR_UNEXPECTED} ${this.chalk.red(error)}`;

      return this.terminator.terminate(1, { logs: [message] });
    }
  }

  async createAccount() {
    this.logger.info('Create an account:');
    const authConfig = await this.inquirer.prompt([{
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
      validate: validatePassword,
    }]);

    try {
      await this.api.createUser(authConfig);
    } catch (error) {
      const message = error.message === 'Conflict'
        ? `This account already exists. Please, use the command ${this.chalk.cyan('lumber login')} to login with this account.`
        : `${ERROR_UNEXPECTED} ${this.chalk.red(error)}`;

      return this.terminator.terminate(1, { logs: [message] });
    }

    const token = await this.login(authConfig.email, authConfig.password);
    this.logger.success('\nAccount successfully created.\n');

    return token;
  }

  async loginFromCommandLine(config) {
    const { email, token } = config;
    let sessionToken;
    try {
      sessionToken = token || this.fs.readFileSync(this.pathToLumberrc, { encoding: 'utf8' });
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
  }
}

module.exports = Authenticator;
