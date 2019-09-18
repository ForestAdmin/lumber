const _ = require('lodash');
const program = require('commander');
const logger = require('./services/logger');
const importFrom = require('import-from');
const inquirer = require('inquirer');

program
  .description('Run a command from a plugin')
  .parse(process.argv);

(async () => {
  try {
    if (!program.args[0]) {
      logger.error(
        'Missing plugin:cmd in the command.',
        'Please specify the plugin and the command you want to run. Type lumber help for more information.',
      );

      return process.exit(1);
    }

    const [pkgName, cmd] = program.args[0].split(':');
    if (!pkgName || !cmd) {
      logger.error('Bad plugin:cmd argument.');
      return process.exit(1);
    }

    const pkg = importFrom(process.cwd(), pkgName);

    if (_.isFunction(pkg.run)) {
      await pkg.runCommand(cmd, logger, inquirer);
    } else {
      logger.error('The plugin does not support commands.');
      return process.exit(1);
    }

    return process.exit(0);
  } catch (err) {
    logger.error(err);
    return process.exit(1);
  }
})();
