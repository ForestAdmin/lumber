const fs = require('fs');
const os = require('os');
const P = require('bluebird');
const chalk = require('chalk');
const agent = require('superagent-promise')(require('superagent'), P);
const GuestSerializer = require('../serializers/guest');
const UserSerializer = require('../serializers/user');
const ProjectSerializer = require('../serializers/project');
const EnvironmentSerializer = require('../serializers/environment');
const GuestDeserializer = require('../deserializers/guest');
const ProjectDeserializer = require('../deserializers/project');
const EnvironmentDeserializer = require('../deserializers/environment');
const logger = require('./logger');

function Authenticator() {
  this.getAuthToken = () => {
    try {
      return fs.readFileSync(`${os.homedir()}/.lumberrc`);
    } catch (e) {
      return null;
    }
  };

  this.createProject = config => agent
    .post(`${config.serverHost}/api/projects`)
    .set('Authorization', `Bearer ${config.authToken}`)
    .set('forest-origin', 'Lumber')
    .send(new ProjectSerializer({
      name: config.appName,
    }))
    .catch((error) => {
      if (error.status !== 409) {
        throw error;
      }

      const { projectId } = error.response.body.errors[0].meta;
      return agent
        .get(`${config.serverHost}/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${config.authToken}`)
        .set('forest-origin', 'Lumber')
        .send();
    })
    /* eslint new-cap: off */
    .then(response => new ProjectDeserializer.deserialize(response.body))
    .then((project) => {
      /* eslint no-param-reassign: off */
      project.name = config.appName;
      const environment = project.defaultEnvironment;

      // NOTICE: Update the apiEndpoint.
      return agent
        .put(`${config.serverHost}/api/environments/${environment.id}`)
        .set('Authorization', `Bearer ${config.authToken}`)
        .send(new EnvironmentSerializer({
          id: environment.id,
          apiEndpoint: `http://${config.appHostname}:${config.appPort}`,
        }))
        .then(() => project);
    });

  this.registerAndCreateProject = config => agent
    .post(`${config.serverHost}/api/guests`)
    .set('forest-origin', 'Lumber')
    .send(new GuestSerializer({ email: config.email }))
    .then(response => new GuestDeserializer.deserialize(response.body))
    .then((guest) => {
      const rendering = guest.project.defaultEnvironment.renderings[0];
      return { guest, rendering };
    })
    .then(({ guest, rendering }) => {
      const user = {
        id: guest.user.id,
        email: config.email,
        password: config.password,
        guest,
        projects: [{ id: guest.project.id }],
      };

      const userPayload = new UserSerializer(user);

      // NOTICE: Register the user.
      return agent
        .put(`${config.serverHost}/api/users/${guest.user.id}`, userPayload)
        .then(() => this.login(config))
        // NOTICE: Update the project name.
        .then(() => agent
          .put(`${config.serverHost}/api/projects/${guest.project.id}`)
          .set('Authorization', `Bearer ${config.authToken}`)
          .send(new ProjectSerializer({
            id: guest.project.id,
            name: config.appName,
          }))
          .end())
        .then(response => new ProjectDeserializer.deserialize(response.body))
        .then((project) => {
          guest.project.name = project.name;
          const environment = project.defaultEnvironment;

          // NOTICE: Update the apiEndpoint.
          return agent
            .put(`${config.serverHost}/api/environments/${environment.id}`)
            .set('Authorization', `Bearer ${config.authToken}`)
            .send(new EnvironmentSerializer({
              id: environment.id,
              apiEndpoint: `http://${config.appHostname}:${config.appPort}`,
            }))
            .end()
            .then(response => new EnvironmentDeserializer.deserialize(response.body))
            .then((newEnv) => {
              project.defaultEnvironment = newEnv;
              project.defaultEnvironment.renderings = [rendering];
              return project;
            });
        });
    })
    .catch((err) => {
      if (err.status === 409) {
        // NOTICE: Account already exists
        return this.login(config).then(() => this.createProject(config));
      }

      logger.error('💀  Ouch, cannot create your account 💀');
      console.error(err);

      return process.exit(1);
    });

  this.login = config => agent
    .post(`${config.serverHost}/api/sessions`, {
      email: config.email,
      password: config.password,
    })
    .then(response => response.body)
    .then((auth) => {
      config.authToken = auth.token;
      return fs.writeFileSync(`${os.homedir()}/.lumberrc`, auth.token);
    });

  this.logout = async (opts) => {
    const path = `${os.homedir()}/.lumberrc`;

    return new P((resolve, reject) => {
      fs.stat(path, (err) => {
        if (err === null) {
          fs.unlinkSync(path);

          if (opts.log) {
            console.log(chalk.green('👍  You\'re now unlogged 👍 '));
          }

          resolve();
        } else if (err.code === 'ENOENT') {
          if (opts.log) {
            logger.error('🔥  You\'re not logged 🔥');
          }

          resolve();
        } else {
          reject(err);
        }
      });
    });
  };

  this.authenticateAndCreateProject = (config) => {
    return this.createProject(config);
  };
}

module.exports = new Authenticator();
