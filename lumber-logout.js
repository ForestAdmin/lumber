const program = require('commander');
const context = require('./context');
const initContext = require('./context/init');

initContext(context);

const { logger, authenticator } = context.inject();

if (!logger) throw new Error('Missing dependency logger');
if (!authenticator) throw new Error('Missing dependency authenticator');

program
  .description('Log out from Forest Admin API')
  .parse(process.argv);

(async () => {
  const wasLoggedIn = await authenticator.logout();
  if (wasLoggedIn) {
    logger.success('Logout successful');
  }
  process.exit(0);
})().catch(async (error) => {
  logger.error(error);
  process.exit(1);
});
