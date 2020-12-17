const chalk = require('chalk');
const context = require('../context');

const { api } = context.inject();

const KeyGenerator = require('./key-generator');
const { terminate } = require('../utils/terminator');
const { ERROR_UNEXPECTED } = require('../utils/messages');

if (!api) throw new Error('Missing dependency api');

function ProjectCreator(sessionToken) {
  this.createProject = async (projectName, config) => {
    try {
      const newProject = await api.createProject(config, sessionToken, { name: projectName });

      return {
        envSecret: newProject.defaultEnvironment.secretKey,
        authSecret: await new KeyGenerator().generate(),
      };
    } catch (error) {
      let message;
      if (error.message === 'Unauthorized') {
        message = `Your session has expired. Please log back in with the command ${chalk.cyan('lumber login')}.`;
      } else if (error.message === 'Conflict') {
        message = 'A project with this name already exists. Please choose another name.';
      } else {
        message = `${ERROR_UNEXPECTED} ${chalk.red(error)}`;
      }

      return terminate(1, {
        logs: [message],
      });
    }
  };
}

module.exports = ProjectCreator;
