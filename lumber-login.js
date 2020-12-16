const program = require('commander');
const inquirer = require('inquirer');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

const { EMAIL_REGEX } = require('./utils/regexs');

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
  let { email } = program;

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

  const token = await authenticator.loginWithEmailOrTokenArgv({ ...program, email });
  authenticator.saveToken(token);

  logger.success('Login successful');
  process.exit(0);
})().catch(async (error) => {
  logger.error(error);
  process.exit(1);
});
