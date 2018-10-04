const program = require('commander');
const authenticator = require('./services/authenticator');

program
  .description('Sign out of your account.')
  .parse(process.argv);

(async () => {
  await authenticator.logout({ log: true });
})();
