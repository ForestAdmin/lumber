'use strict';
var fs = require('fs');
var os = require('os');
var P = require('bluebird');
var chalk = require('chalk');
var agent = require('superagent-promise')(require('superagent'), P);
var GuestSerializer = require('../serializers/guest');
var UserSerializer = require('../serializers/user');
var ProjectSerializer = require('../serializers/project');
var EnvironmentSerializer = require('../serializers/environment');
var GuestDeserializer = require('../deserializers/guest');
var ProjectDeserializer = require('../deserializers/project');
var EnvironmentDeserializer = require('../deserializers/environment');
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
                apiEndpoint: 'http://localhost:3000'
              }))
              .end();
          })
          .then(() => project);
      });
  };

  this.register = (config) => {
    let guest = { email: config.email };

    return agent
      .post(`${config.serverHost}/api/guests`)
      .set('forest-origin', 'Lumber')
      .send(new GuestSerializer(guest))
      .then((response) => new GuestDeserializer.deserialize(response.body))
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
                apiEndpoint: 'http://localhost:3000'
              }))
              .end()
              .then((response) => new EnvironmentDeserializer.deserialize(response.body))
              .then((environment) => {
                project.defaultEnvironment = environment;
                return project;
              });
          });
      })
      .catch((err) => {
        if (err.status === 409) {
          logger.error('💀  Oops, this email already exists. Please, run ' +
            chalk.bold('$ lumber login') + ' before 💀');
        } else {
          logger.error('💀  Ouch, cannot create your account 💀');
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
}

module.exports = new Authenticator();
