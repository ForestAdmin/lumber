const chalk = require('chalk');
const Authenticator = require('./authenticator');
const api = require('./api');
const KeyGenerator = require('./key-generator');
const logger = require('./logger');

function ProjectCreator() {
  const auth = new Authenticator();

  this.createProject = async (projectName, config) => {
    const sessionToken = await auth.loginFromCommandLine(config);

    try {
      const newProject = await api.createProject(config, sessionToken, { name: projectName });

      return {
        envSecret: newProject.defaultEnvironment.secretKey,
        authSecret: await new KeyGenerator().generate(),
      };
    } catch (error) {
      if (error.message === 'Unauthorized') {
        logger.error(`Your session has expired. Please, relogin with the command ${chalk.cyan('lumber run lumber-forestadmin:login')}.`);
      } else if (error.message === 'Conflict') {
        logger.error('A project with this name already exists. Please choose another name.');
      } else {
        logger.error(`An unexpected error occured. Please create a Github issue with following error: ${chalk.red(error)}`);
      }

      return process.exit(1);
    }
  };
}

module.exports = ProjectCreator;
