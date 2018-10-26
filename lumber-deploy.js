const program = require('commander');
const chalk = require('chalk');

program
  .description('Deploy your back office to your production environment.')
  .parse(process.argv);

console.log(`Read the instructions: \n ${chalk.green('https://docs.forestadmin.com/lumber/getting-started/setup-guide#deploy-to-production')}`);
