const program = require('commander');
const chalk = require('chalk');

program
  .description('Deploy your admin interface to your production environment.')
  .parse(process.argv);

console.log(`Read the instructions: \n ${chalk.green('https://doc.forestadmin.com/developer-guide/lumber.html#deploy-to-production')}`);
