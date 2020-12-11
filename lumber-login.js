const program = require('commander');
const inquirer = require('inquirer');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

const { EMAIL_REGEX } = require('./utils/regexs');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

const { oidcAuthenticator, errorHandler, applicationTokenService } = context.inject();

const { logger, authenticator } = context.inject();

if (!logger) throw new Error('Missing dependency logger');
if (!authenticator) throw new Error('Missing dependency authenticator');

program
  .description('Log into Forest Admin API')
  .option('-e, --email <email>', 'Your Forest Admin account email')
  .option('-P, --password <password>', 'Your Forest Admin account password (ignored if token is set)')
  .option('-t, --token <token>', 'Your Forest Admin account token (replaces password)')
  .parse(process.argv);

(async () => {
  const auth = new Authenticator();

  let { email, token } = program;
  const { password } = program;

  if (!token && !password) {
    const sessionToken = await oidcAuthenticator.authenticate();
    token = await applicationTokenService.generateApplicationToken(sessionToken);
  } else {
    if (!email) {
      ({ email } = await inquirer.prompt([{
        type: 'input',
        name: 'email',
        message: 'What\'s your email address?',
        validate: (input) => {
          if (EMAIL_REGEX.test(input)) { return true; }
          return input ? 'Invalid email' : 'Please enter your email address.';
        },
      }]));
    }

    token = await auth.loginWithEmailOrTokenArgv({ ...program, email });
  }

  auth.saveToken(token);
  logger.success('Login successful');
  process.exit(0);
})().catch(async (error) => {
  await errorHandler.handle(error);
});
