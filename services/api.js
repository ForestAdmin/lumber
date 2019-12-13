const agent = require('superagent');
const UserSerializer = require('../serializers/user');
const UserDeserializer = require('../deserializers/user');
const ProjectSerializer = require('../serializers/project');
const ProjectDeserializer = require('../deserializers/project');
const EnvironmentSerializer = require('../serializers/environment');
const EnvironmentDeserializer = require('../deserializers/environment');
const pkg = require('../package.json');

function API() {
  this.endpoint = process.env.FOREST_URL || 'https://api.forestadmin.com';
  this.userAgent = `lumber@${pkg.version}`;

  this.isGoogleAccount = async (email) => agent
    .get(`${this.endpoint}/api/users/google/${email}`)
    .set('forest-origin', 'Lumber')
    .set('Content-Type', 'application/json')
    .set('User-Agent', this.userAgent)
    .send()
    .then((response) => response.body.data.isGoogleAccount)
    .catch(() => false);

  this.login = async (email, password) => agent
    .post(`${this.endpoint}/api/sessions`)
    .set('forest-origin', 'Lumber')
    .set('Content-Type', 'application/json')
    .set('User-Agent', this.userAgent)
    .send({ email, password })
    .then((response) => response.body.token);

  this.createUser = async (user) => agent
    .post(`${this.endpoint}/api/users`)
    .set('forest-origin', 'Lumber')
    .set('Content-Type', 'application/json')
    .set('User-Agent', this.userAgent)
    .send(new UserSerializer(user))
    .then((response) => UserDeserializer.deserialize(response.body));

  this.createProject = async (config, sessionToken, project) => {
    let newProject;

    try {
      newProject = await agent
        .post(`${this.endpoint}/api/projects`)
        .set('forest-origin', 'Lumber')
        .set('Content-Type', 'application/json')
        .set('User-Agent', this.userAgent)
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(new ProjectSerializer(project))
        .then((response) => ProjectDeserializer.deserialize(response.body));
    } catch (error) {
      if (error.message === 'Conflict') {
        const { projectId } = error.response.body.errors[0].meta;

        if (!projectId) {
          throw error;
        }

        newProject = await agent
          .get(`${this.endpoint}/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${sessionToken}`)
          .set('forest-origin', 'Lumber')
          .set('User-Agent', this.userAgent)
          .send()
          .then((response) => ProjectDeserializer.deserialize(response.body));

        // NOTICE: Avoid to erase an existing project that has been already initialized.
        if (newProject.initializedAt) { throw error; }
      } else {
        throw error;
      }
    }

    const hostname = config.appHostname || 'http://localhost';
    const port = config.appPort || 3310;
    const protocol = hostname.startsWith('http') ? '' : 'http://';
    newProject.defaultEnvironment.apiEndpoint = `${protocol}${hostname}:${port}`;
    const updatedEnvironment = await agent
      .put(`${this.endpoint}/api/environments/${newProject.defaultEnvironment.id}`)
      .set('forest-origin', 'Lumber')
      .set('Content-Type', 'application/json')
      .set('User-Agent', this.userAgent)
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(new EnvironmentSerializer(newProject.defaultEnvironment))
      .then((response) => EnvironmentDeserializer.deserialize(response.body));

    newProject.defaultEnvironment.secretKey = updatedEnvironment.secretKey;

    return newProject;
  };
}

module.exports = new API();
