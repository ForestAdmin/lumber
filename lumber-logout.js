const program = require('commander');
const logger = require('./services/logger');
const Authenticator = require('./services/authenticator');

program
  .description('Log out from Forest Admin API')
  .parse(process.argv);

(async () => {
  const wasLoggedIn = await new Authenticator().logout();
  if (wasLoggedIn) {
    logger.success('Logout successful');
  }
  process.exit(0);
})().catch(async (error) => {
  logger.error(error);
  process.exit(1);
});
