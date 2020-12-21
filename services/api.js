const UserSerializer = require('../serializers/user');
const UserDeserializer = require('../deserializers/user');
const ProjectSerializer = require('../serializers/project');
const ProjectDeserializer = require('../deserializers/project');
const EnvironmentSerializer = require('../serializers/environment');
const EnvironmentDeserializer = require('../deserializers/environment');

const HEADER_CONTENT_TYPE = 'Content-Type';
const HEADER_CONTENT_TYPE_JSON = 'application/json';
const HEADER_FOREST_ORIGIN = 'forest-origin';
const HEADER_USER_AGENT = 'User-Agent';

class Api {
  /**
   * @param {import('../context/init').Context} context
   */
  constructor(context) {
    this.applicationTokenSerializer = context.applicationTokenSerializer;
    this.applicationTokenDeserializer = context.applicationTokenDeserializer;
    this.agent = context.superagent;
    this.env = context.env;
    this.pkg = context.pkg;

    ['applicationTokenSerializer',
      'applicationTokenDeserializer',
      'agent',
      'env',
      'pkg',
    ].forEach((name) => {
      if (!this[name]) throw new Error(`Missing dependency ${name}`);
    });

    this.endpoint = this.env.FOREST_URL || 'https://api.forestadmin.com';
    this.userAgent = `lumber@${this.pkg.version}`;
  }

  async isGoogleAccount(email) {
    return this.agent
      .get(`${this.endpoint}/api/users/google/${email}`)
      .set(HEADER_FOREST_ORIGIN, 'Lumber')
      .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
      .set(HEADER_USER_AGENT, this.userAgent)
      .send()
      .then((response) => response.body.data.isGoogleAccount)
      .catch(() => false);
  }

  async login(email, password) {
    return this.agent
      .post(`${this.endpoint}/api/sessions`)
      .set(HEADER_FOREST_ORIGIN, 'Lumber')
      .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
      .set(HEADER_USER_AGENT, this.userAgent)
      .send({ email, password })
      .then((response) => response.body.token);
  }

  async createUser(user) {
    return this.agent
      .post(`${this.endpoint}/api/users`)
      .set(HEADER_FOREST_ORIGIN, 'Lumber')
      .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
      .set(HEADER_USER_AGENT, this.userAgent)
      .send(new UserSerializer(user))
      .then((response) => UserDeserializer.deserialize(response.body));
  }

  async createProject(config, sessionToken, project) {
    let newProject;

    try {
      newProject = await this.agent
        .post(`${this.endpoint}/api/projects`)
        .set(HEADER_FOREST_ORIGIN, 'Lumber')
        .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
        .set(HEADER_USER_AGENT, this.userAgent)
        .set('Authorization', `Bearer ${sessionToken}`)
        .send(new ProjectSerializer(project))
        .then((response) => ProjectDeserializer.deserialize(response.body));
    } catch (error) {
      if (error.message === 'Conflict') {
        const { projectId } = error.response.body.errors[0].meta;

        if (!projectId) {
          throw error;
        }

        newProject = await this.agent
          .get(`${this.endpoint}/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${sessionToken}`)
          .set(HEADER_FOREST_ORIGIN, 'Lumber')
          .set(HEADER_USER_AGENT, this.userAgent)
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
    const updatedEnvironment = await this.agent
      .put(`${this.endpoint}/api/environments/${newProject.defaultEnvironment.id}`)
      .set(HEADER_FOREST_ORIGIN, 'Lumber')
      .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
      .set(HEADER_USER_AGENT, this.userAgent)
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(new EnvironmentSerializer(newProject.defaultEnvironment))
      .then((response) => EnvironmentDeserializer.deserialize(response.body));

    newProject.defaultEnvironment.secretKey = updatedEnvironment.secretKey;

    return newProject;
  }

  /**
   * @param {import('../serializers/application-token').InputApplicationToken} applicationToken
   * @param {string} sessionToken
   * @returns {Promise<import('../deserializers/application-token').ApplicationToken>}
   */
  async createApplicationToken(applicationToken, sessionToken) {
    return this.agent
      .post(`${this.endpoint}/api/application-tokens`)
      .set(HEADER_FOREST_ORIGIN, 'Lumber')
      .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
      .set(HEADER_USER_AGENT, this.userAgent)
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(this.applicationTokenSerializer.serialize(applicationToken))
      .then((response) => this.applicationTokenDeserializer.deserialize(response.body));
  }

  /**
   * @param {import('../serializers/application-token').InputApplicationToken} applicationToken
   * @param {string} sessionToken
   * @returns {Promise<import('../deserializers/application-token').ApplicationToken>}
   */
  async deleteApplicationToken(applicationToken) {
    return this.agent
      .delete(`${this.endpoint}/api/application-tokens`)
      .set(HEADER_FOREST_ORIGIN, 'Lumber')
      .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
      .set(HEADER_USER_AGENT, this.userAgent)
      .set('Authorization', `Bearer ${applicationToken}`)
      .send();
  }
}

module.exports = Api;
