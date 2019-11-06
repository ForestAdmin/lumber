const chalk = require('chalk');
const Authenticator = require('./authenticator');
const api = require('./api');
const KeyGenerator = require('./key-generator');
const { terminate } = require('../utils/terminator');
const { UnexpectedError } = require('../utils/errors');

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
      let message;
      if (error.message === 'Unauthorized') {
        message = `Your session has expired. Please log back in with the command ${chalk.cyan('lumber login')}.`;
      } else if (error.message === 'Conflict') {
        message = 'A project with this name already exists. Please choose another name.';
      } else {
        message = UnexpectedError(error);
      }

      return terminate(1, {
        logs: [message],
      });
    }
  };
}

module.exports = ProjectCreator;
