'use strict';
const fs = require('fs');
const os = require('os');
const P = require('bluebird');
const _ = require('lodash');
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

  this.createProject = (config) => {
    return agent
      .post(`${config.serverHost}/api/projects`)
      .set('Authorization', `Bearer ${config.authToken}`)
      .set('forest-origin', 'Lumber')
      .send(new ProjectSerializer({
        name: config.appName
      }))
      .then((response) => new ProjectDeserializer.deserialize(response.body))
      .then((project) => {
        project.name = config.appName;
        let environment = project.defaultEnvironment;

        // NOTICE: Update the project name.
        return agent
          .put(`${config.serverHost}/api/projects/${project.id}`)
          .set('Authorization', `Bearer ${config.authToken}`)
          .send(new ProjectSerializer({
            id: project.id,
            name: config.appName
          }))
          .end()
          .then(() => {
            // NOTICE: Update the apiEndpoint.
            return agent
              .put(`${config.serverHost}/api/environments/${environment.id}`)
              .set('Authorization', `Bearer ${config.authToken}`)
              .send(new EnvironmentSerializer({
                id: environment.id,
                apiEndpoint: `http://${config.appHostname}:${config.appPort}`
              }))
              .end();
          })
          .then(() => project);
      });
  };

  this.registerAndCreateProject = (config) => {
    let guest = { email: config.email };
    let rendering;

    return agent
      .post(`${config.serverHost}/api/guests`)
      .set('forest-origin', 'Lumber')
      .send(new GuestSerializer(guest))
      .then((response) => new GuestDeserializer.deserialize(response.body))
      .then((guest) => {
        rendering = guest.project.defaultEnvironment.renderings[0];
        return guest;
      })
      .then((guest) => {
        let user = {
          id: guest.user.id,
          email: config.email,
          password: config.password,
          guest: guest,
          projects: [{ id: guest.project.id }]
        };

        let userPayload = new UserSerializer(user);

        // NOTICE: Register the user.
        return agent
          .put(`${config.serverHost}/api/users/${guest.user.id}`, userPayload)
          .then(() => this.login(config))
          .then(() => {
            // NOTICE: Update the project name.
            return agent
              .put(`${config.serverHost}/api/projects/${guest.project.id}`)
              .set('Authorization', `Bearer ${config.authToken}`)
              .send(new ProjectSerializer({
                id: guest.project.id,
                name: config.appName
              }))
              .end();
          })
          .then((response) => new ProjectDeserializer.deserialize(response.body))
          .then((project) => {
            guest.project.name = project.name;
            let environment = project.defaultEnvironment;

            // NOTICE: Update the apiEndpoint.
            return agent
              .put(`${config.serverHost}/api/environments/${environment.id}`)
              .set('Authorization', `Bearer ${config.authToken}`)
              .send(new EnvironmentSerializer({
                id: environment.id,
                apiEndpoint: `http://${config.appHostname}:${config.appPort}`
              }))
              .end()
              .then((response) => new EnvironmentDeserializer.deserialize(response.body))
              .then((environment) => {
                project.defaultEnvironment = environment;
                return project;
              })
              .then((project) => {
                project.defaultEnvironment.renderings = [rendering];
                return project;
              })
          });
      })
      .catch((err) => {
        if (err.status === 409) {
          // NOTICE: Account already exists
          return this.login(config)
            .then(() => this.createProject(config));
        } else {
          logger.error('💀  Ouch, cannot create your account 💀');
          console.error(err);
        }

        process.exit(1);
      });
  };

  this.login = (config) => {
    return agent
      .post(`${config.serverHost}/api/sessions`, {
        email: config.email,
        password: config.password,
      })
      .then((response) => response.body)
      .then((auth) => {
        config.authToken = auth.token;
        return fs.writeFileSync(`${os.homedir()}/.lumberrc`, auth.token);
      });
  };

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
    if (config.authToken) {
      return this.createProject(config);
    }

    return this.registerAndCreateProject(config);
  };
}

module.exports = new Authenticator();
