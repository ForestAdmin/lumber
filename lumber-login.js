const program = require('commander');
const inquirer = require('inquirer');
const context = require('./context');
const initContext = require('./context/init');
const { EMAIL_REGEX } = require('./utils/regexs');

initContext(context);

const {
  logger, authenticator, oidcAuthenticator, errorHandler, applicationTokenService,
} = context.inject();

if (!logger) throw new Error('Missing dependency logger');
if (!authenticator) throw new Error('Missing dependency authenticator');
if (!errorHandler) throw new Error('Missing dependency errorHandler');
if (!applicationTokenService) throw new Error('Missing dependency applicationTokenService');

program
  .description('Log into Forest Admin API')
  .option('-e, --email <email>', 'Your Forest Admin account email')
  .option('-P, --password <password>', 'Your Forest Admin account password (ignored if token is set)')
  .option('-t, --token <token>', 'Your Forest Admin account token (replaces password)')
  .parse(process.argv);

(async () => {
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

    token = await authenticator.loginWithEmailOrTokenArgv({ ...program, email });
  }

  authenticator.saveToken(token);
  logger.success('Login successful');
  process.exit(0);
})().catch(async (error) => {
  await errorHandler.handle(error);
});
