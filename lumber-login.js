const program = require('commander');
const chalk = require('chalk');
const authenticator = require('./services/authenticator');
const Prompter = require('./services/prompter');
const logger = require('./services/logger');

program
  .description('Sign in with an existing account.')
  .parse(process.argv);

(async () => {
  const config = await Prompter(program, [
    'email',
    'password',
  ]);

  try {
    await authenticator.login(config);
    console.log(chalk.green(`👍  You're now logged as ${config.email} 👍 `));
  } catch (err) {
    if (err.status) {
      logger.error('🔥  The email or password you entered is incorrect 🔥');
    } else {
      logger.error('💀  Oops, something went wrong.💀');
    }
  }
})().catch((error) => {
  logger.error('💀  Oops, operation aborted 💀 due to the following error: ', error);
  process.exit(1);
});
