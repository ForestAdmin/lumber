const chalk = require('chalk');
const DirectoryExistenceChecker = require('../directory-existence-checker');
const eventSender = require('../event-sender');
const logger = require('../logger');
const PromptUtils = require('./prompt-utils');

class ProjectPrompts extends PromptUtils {
  constructor(projectName, envConfig, requests) {
    super(requests);
    this.projectName = projectName;
    this.envConfig = envConfig;
  }

  async handlePrompts() {
    await this.handleName();
  }

  async handleName() {
    if (this.isOptionRequested('appName')) {
      if (!this.projectName) {
        logger.error(
          'Missing project name in the command.',
          'Please specify a project name. Type lumber help for more information.',
        );
        process.exit(1);
      } else if (new DirectoryExistenceChecker(process.cwd(), this.projectName).perform()) {
        const message = `The directory ${chalk.red(`${process.cwd()}/${this.projectName}`)} already exists.`;
        logger.error(
          message,
          'Please retry with another project name.',
        );
        await eventSender.notifyError('unknown_error', message);
        process.exit(1);
      } else {
        this.envConfig.appName = this.projectName;
      }
    }
  }
}

module.exports = ProjectPrompts;
