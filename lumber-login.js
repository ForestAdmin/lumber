const program = require('commander');
const logger = require('./services/logger');
const Authenticator = require('./services/authenticator');

program
  .description('Log into Forest Admin API')
  .option('-e, --email <email>', 'Your Forest Admin account email')
  .option('-P, --password <password>', 'Your Forest Admin account password (ignored if token is set)')
  .option('-t, --token <token>', 'Your Forest Admin account token (replaces password)')
  .parse(process.argv);

(async () => {
  await new Authenticator().loginFromCommandLine(program);
  logger.success('Login successful');
  process.exit(0);
})().catch(async (error) => {
  logger.error(error);
  process.exit(1);
});
