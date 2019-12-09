const inquirer = require('inquirer');
const _ = require('lodash');
const ApplicationPrompt = require('./application-prompts');
const DatabasePrompt = require('./database-prompts');
const ProjectPrompt = require('./project-prompts');
const PromptError = require('./prompter-error');
const UserPrompt = require('./user-prompts');
const Terminator = require('../../utils/terminator');

class GeneralPrompter {
  constructor(requests, program) {
    this.prompts = [];
    this.program = program;
    this.envConfig = {};

    this.projectPrompt = new ProjectPrompt(requests, this.envConfig, program);
    this.databasePrompt = new DatabasePrompt(requests, this.envConfig, this.prompts, program);
    this.applicationPrompt = new ApplicationPrompt(requests, this.envConfig, this.prompts, program);
    this.userPrompt = new UserPrompt(requests, this.envConfig, this.prompts, program);

    this.initSourceDirectory();
  }

  initSourceDirectory() {
    if (this.program.sourceDirectory) {
      this.envConfig.sourceDirectory = this.program.sourceDirectory;
    } else {
      this.envConfig.sourceDirectory = process.cwd();
    }
  }

  async getConfig() {
    try {
      await this.projectPrompt.handlePrompts();
      await this.databasePrompt.handlePrompts();
      await this.applicationPrompt.handlePrompts();
      await this.userPrompt.handlePrompts();
    } catch (error) {
      if (error instanceof PromptError) {
        await Terminator.terminate(1, {
          errorCode: error.errorCode,
          errorMessage: error.errorMessage,
          logs: error.logs,
        });
      } else {
        throw error;
      }
    }

    this.config = await inquirer.prompt(this.prompts);

    this.cleanConfigOptions();

    return _.merge(this.config, this.envConfig);
  }

  cleanConfigOptions() {
    if (!this.config) { return; }

    // NOTICE: Remove the dbPassword if there's no password for the DB
    // connection.
    if (!this.config.dbPassword) { delete this.config.dbPassword; }
  }
}

module.exports = GeneralPrompter;
