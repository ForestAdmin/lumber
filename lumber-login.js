const program = require('commander');
const chalk = require('chalk');
const authenticator = require('./services/authenticator');
const Prompter = require('./services/prompter');
const logger = require('./services/logger');

const MESSAGE_FAILED = 'Cannot log you in.';
const DESCRIPTION_FAIL_UNEXPECTED = 'An unexpected error occured. Please create a Github issue with following error: ';

program
  .description('Sign in with an existing account.')
  .parse(process.argv);

if (!program.args[0]) {
  logger.error(
    'Missing your email address in the command.',
    'Type lumber help for more information.',
  );
  process.exit(1);
}

(async () => {
  await authenticator
    .logout({ log: false });

  const config = await Prompter(program, ['password']);
  [config.email] = program.args;

  try {
    await authenticator.login(config);
    logger.success(`You're now logged as ${chalk.green(config.email)}`);
  } catch (err) {
    let description;
    if (err.status) {
      description = `The ${chalk.red('email')} or ${chalk.red('password')} you entered is incorrect.`;
    } else {
      description = `${DESCRIPTION_FAIL_UNEXPECTED}${chalk.red(err)}.`;
    }
    logger.error(
      MESSAGE_FAILED,
      description,
    );
  }
})().catch((error) => {
  logger.error(
    MESSAGE_FAILED,
    `${DESCRIPTION_FAIL_UNEXPECTED}${chalk.red(error)}.`,
    error,
  );
  process.exit(1);
});
