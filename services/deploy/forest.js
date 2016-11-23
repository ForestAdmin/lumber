'use strict';
const fs = require('fs');
const os = require('os');
const P = require('bluebird');
const EnvironmentSerializer = require('../../serializers/environment');
const EnvironmentDeserializer = require('../../deserializers/environment');
const ProjectDeserializer = require('../../deserializers/project');
const agent = require('superagent-promise')(require('superagent'), P);

function Forest(config) {

  this.setConfig = (newConfig) => config = newConfig;

  this.login = () => {
    return new P((resolve, reject) => {
      try {
        config.authToken = fs.readFileSync(`${os.homedir()}/.lumberrc`).toString();
        resolve(config.authToken);
      } catch (e) {
        reject(e);
      }
    });
  };

  this.getProjects = () => {
    return agent
      .get(`${config.serverHost}/api/projects`)
      .set('Authorization', `Bearer ${config.authToken}`)
      .set('forest-origin', 'Lumber')
      .send()
      .then((response) => {
        return new ProjectDeserializer.deserialize(response.body);
      });
  };

  this.createEnvironment = (apiEndpoint) => {
    return agent
      .post(`${config.serverHost}/api/environments`)
      .set('Authorization', `Bearer ${config.authToken}`)
      .set('forest-origin', 'Lumber')
      .send(new EnvironmentSerializer({
        name: 'Production',
        apiEndpoint: apiEndpoint,
        project: { id: config.project.id }
      }))
      .then((response) => {
        return new EnvironmentDeserializer.deserialize(response.body);
      });
  };
}

module.exports = Forest;
