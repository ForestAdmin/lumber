const expandHomeDir = require('expand-home-dir');
const inquirer = require('inquirer');
const path = require('path');
const _ = require('lodash');
const ApplicationPrompt = require('./application-prompts');
const DatabasePrompt = require('./database-prompts');
const ProjectPrompt = require('./project-prompts');
const UserPrompt = require('./user-prompts');

class GeneralPrompter {
  constructor(requests, program) {
    this.prompts = [];
    this.program = program;
    this.envConfig = {
      db: program.db,
      password: program.password,
      token: program.token,
      email: program.email,
    };

    this.projectPrompt = new ProjectPrompt(requests, program.args[0], this.envConfig);
    this.databasePrompt = new DatabasePrompt(requests, program, this.envConfig, this.prompts);
    this.applicationPrompt = new ApplicationPrompt(requests, program, this.envConfig, this.prompts);
    this.userPrompt = new UserPrompt(requests, this.envConfig, this.prompts);

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
    await this.projectPrompt.handlePrompts();
    await this.databasePrompt.handlePrompts();
    this.applicationPrompt.handlePrompts();
    this.userPrompt.handlePrompts();

    this.config = await inquirer.prompt(this.prompts);

    this.cleanConfigOptions();

    return _.merge(this.config, this.envConfig);
  }

  cleanConfigOptions() {
    if (!this.config) { return; }

    // NOTICE: Remove the dbPassword if there's no password for the DB
    // connection.
    if (!this.config.dbPassword) { delete this.config.dbPassword; }

    // NOTICE: Expand the dbStorage ~ path.
    if (this.config.dbStorage) {
      this.config.dbStorage = path.resolve(expandHomeDir(this.config.dbStorage));
    }
  }
}

module.exports = GeneralPrompter;
