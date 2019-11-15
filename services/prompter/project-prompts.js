const chalk = require('chalk');
const DirectoryExistenceChecker = require('../directory-existence-checker');
const AbstractPrompter = require('./abstract-prompter');
const PrompterError = require('./prompter-error');
const messages = require('../../utils/messages');

class ProjectPrompts extends AbstractPrompter {
  constructor(requests, envConfig, program) {
    super(requests);
    this.envConfig = envConfig;
    this.program = program;
  }

  async handlePrompts() {
    await this.handleName();
  }

  async handleName() {
    if (this.isOptionRequested('appName')) {
      const [projectName] = this.program.args;

      if (!projectName) {
        throw new PrompterError(
          messages.ERROR_MISSING_PROJECT_NAME,
          [
            messages.ERROR_MISSING_PROJECT_NAME,
            messages.HINT_MISSING_PROJECT_NAME,
          ],
        );
      } else if (new DirectoryExistenceChecker(process.cwd(), projectName).perform()) {
        const message = `The directory ${chalk.red(`${process.cwd()}/${projectName}`)} already exists.`;
        throw new PrompterError(
          message,
          [
            message,
            messages.HINT_DIRECTORY_ALREADY_EXISTS,
          ],
        );
      } else {
        this.envConfig.appName = projectName;
      }
    }
  }
}

module.exports = ProjectPrompts;
