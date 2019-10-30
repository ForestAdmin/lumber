const program = require('commander');
const inquirer = require('inquirer');
const logger = require('./services/logger');
const Authenticator = require('./services/authenticator');

program
  .description('Log into Forest Admin API')
  .option('-e, --email <email>', 'Your Forest Admin account email')
  .option('-P, --password <password>', 'Your Forest Admin account password (ignored if token is set)')
  .option('-t, --token <token>', 'Your Forest Admin account token (replaces password)')
  .parse(process.argv);

(async () => {
  const auth = new Authenticator();
  let { email } = program;

  if (!email) {
    ({ email } = await inquirer.prompt([{
      type: 'input',
      name: 'email',
      message: 'What\'s your email address?',
      validate: (input) => {
        if (input) { return true; }
        return 'Please enter your email address.';
      },
    }]));
  }

  const token = await auth.loginWithEmailOrTokenArgv({ ...program, email });
  auth.saveToken(token);

  logger.success('Login successful');
  process.exit(0);
})().catch(async (error) => {
  logger.error(error);
  process.exit(1);
});
