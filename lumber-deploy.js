const program = require('commander');
const chalk = require('chalk');
const logger = require('./services/logger');

program
  .description('Deploy your admin panel API to your production environment.')
  .parse(process.argv);

logger.info(
  'You can no longer deploy with this command',
  `Please read the following instructions to deploy: ${chalk.blue('https://docs.forestadmin.com/lumber/getting-started/setup-guide#deploy-to-production')}.`,
);
