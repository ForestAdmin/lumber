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

/**
 * @class
 * @param {import('../context/init').Context} context
 */
function Api(context) {
  const {
    applicationTokenSerializer,
    applicationTokenDeserializer,
    superagent: agent,
    env,
    pkg,
  } = context;

  ['applicationTokenSerializer',
    'applicationTokenDeserializer',
    'superagent',
    'env',
    'pkg',
  ].forEach((name) => {
    if (!context[name]) throw new Error(`Missing dependency ${name}`);
  });

  this.endpoint = env.FOREST_URL || 'https://api.forestadmin.com';
  this.userAgent = `lumber@${pkg.version}`;

  this.isGoogleAccount = async (email) => agent
    .get(`${this.endpoint}/api/users/google/${email}`)
    .set(HEADER_FOREST_ORIGIN, 'Lumber')
    .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
    .set(HEADER_USER_AGENT, this.userAgent)
    .send()
    .then((response) => response.body.data.isGoogleAccount)
    .catch(() => false);

  this.login = async (email, password) => agent
    .post(`${this.endpoint}/api/sessions`)
    .set(HEADER_FOREST_ORIGIN, 'Lumber')
    .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
    .set(HEADER_USER_AGENT, this.userAgent)
    .send({ email, password })
    .then((response) => response.body.token);

  this.createUser = async (user) => agent
    .post(`${this.endpoint}/api/users`)
    .set(HEADER_FOREST_ORIGIN, 'Lumber')
    .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
    .set(HEADER_USER_AGENT, this.userAgent)
    .send(new UserSerializer(user))
    .then((response) => UserDeserializer.deserialize(response.body));

  this.createProject = async (config, sessionToken, project) => {
    let newProject;

    try {
      newProject = await agent
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

        newProject = await agent
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
    const updatedEnvironment = await agent
      .put(`${this.endpoint}/api/environments/${newProject.defaultEnvironment.id}`)
      .set(HEADER_FOREST_ORIGIN, 'Lumber')
      .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
      .set(HEADER_USER_AGENT, this.userAgent)
      .set('Authorization', `Bearer ${sessionToken}`)
      .send(new EnvironmentSerializer(newProject.defaultEnvironment))
      .then((response) => EnvironmentDeserializer.deserialize(response.body));

    newProject.defaultEnvironment.secretKey = updatedEnvironment.secretKey;

    return newProject;
  };

  /**
   * @param {import('../serializers/application-token').InputApplicationToken} applicationToken
   * @param {string} sessionToken
   * @returns {Promise<import('../deserializers/application-token').ApplicationToken>}
   */
  this.createApplicationToken = async (applicationToken, sessionToken) => agent
    .post(`${this.endpoint}/api/application-tokens`)
    .set(HEADER_FOREST_ORIGIN, 'Lumber')
    .set(HEADER_CONTENT_TYPE, HEADER_CONTENT_TYPE_JSON)
    .set(HEADER_USER_AGENT, this.userAgent)
    .set('Authorization', `Bearer ${sessionToken}`)
    .send(applicationTokenSerializer.serialize(applicationToken))
    .then((response) => applicationTokenDeserializer.deserialize(response.body));
}

module.exports = Api;
