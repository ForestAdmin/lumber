const Sequelize = require('sequelize');
const mongodb = require('mongodb');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const inquirer = require('inquirer');
const open = require('open');
const openIdClient = require('openid-client');
const superagent = require('superagent');
const { promisify } = require('util');
const mkdirp = require('mkdirp');
const Handlebars = require('handlebars');
const pkg = require('../package.json');
const applicationTokenDeserializer = require('../deserializers/application-token');
const applicationTokenSerializer = require('../serializers/application-token');
const Api = require('../services/api');
const ApplicationTokenService = require('../services/application-token');
const Database = require('../services/database');
const Dumper = require('../services/dumper');
const logger = require('../services/logger');
const terminator = require('../utils/terminator');
const Authenticator = require('../services/authenticator');
const authenticatorHelper = require('../utils/authenticator-helper');
const OidcAuthenticator = require('../services/oidc/authenticator');
const ErrorHandler = require('../services/error-handler');
const messages = require('../utils/messages');

const fsAsync = {
  readFile: promisify(fs.readFile),
  stat: promisify(fs.stat),
  unlink: promisify(fs.unlink),
};

const DEFAULT_FOREST_URL = 'https://api.forestadmin.com';

/**
 * @typedef {{
 *   FOREST_URL: string;
 * }} Env
 *
 * @typedef {{
 *  env: Env
 *  process: NodeJS.Process,
 *  pkg: import('../package.json'),
 * }} EnvPart
 *
 * @typedef {{
 *  openIdClient: import('openid-client');
 *  chalk: import('chalk');
 *  open: import('open');
 *  fs: import('fs');
 *  os: import('os');
 *  inquirer: import('inquirer');
 *  mkdirp: import('mkdirp');
 *  mongodb: import('mongodb');
 *  Sequelize: import('sequelize');
 *  superagent: import('superagent');
 *  fsAsync: fsAsync;
 *  Handlebars: import('handlebars');
 * }} Dependencies
 *
 * @typedef {{
 *  terminator: import('../utils/terminator');
 *  authenticatorHelper: import('../utils/authenticator-helper');
 *  messages: import('../utils/messages');
 * }} Utils
 *
 * @typedef {{
 *  applicationTokenSerializer: import('../serializers/application-token');
 *  applicationTokenDeserializer: import('../deserializers/application-token');
 * }} Serializers
 *
 * @typedef {{
 *  logger: import('../services/logger');
 *  database: import('../services/database');
 *  dumper: import('../services/dumper');
 *  api: import('../services/api');
 *  authenticator: import('../services/authenticator');
 *  oidcAuthenticator: import('../services/oidc/authenticator');
 *  errorHandler: import('../services/error-handler');
 *  applicationTokenService: import('../services/application-token');
 * }} Services
 *
 * @typedef {EnvPart & Dependencies & Utils & Serializers & Services} Context
 */

function initConstants(context) {
  context.addInstance('constants', {
    DEFAULT_FOREST_URL,
  });
}

/**
 * @param {import('./application-context')} context
 */
function initEnv(context) {
  context.addInstance('env', {
    ...process.env,
    FOREST_URL: process.env.FOREST_URL || DEFAULT_FOREST_URL,
  });
  context.addInstance('process', process);
  context.addInstance('pkg', pkg);
}

/**
 * @param {import('./application-context')} context
 */
function initDependencies(context) {
  context.addInstance('openIdClient', openIdClient);
  context.addInstance('chalk', chalk);
  context.addInstance('open', open);
  context.addInstance('fs', fs);
  context.addInstance('path', path);
  context.addInstance('os', os);
  context.addInstance('inquirer', inquirer);
  context.addInstance('mkdirp', mkdirp);
  context.addInstance('Sequelize', Sequelize);
  context.addInstance('mongodb', mongodb);
  context.addInstance('superagent', superagent);
  context.addInstance('fsAsync', fsAsync);
  context.addInstance('Handlebars', Handlebars);
}

/**
 * @param {import('./application-context')} context
 */
function initUtils(context) {
  context.addInstance('terminator', terminator);
  context.addInstance('messages', messages);
  context.addInstance('authenticatorHelper', authenticatorHelper);
}

/**
 * @param {import('./application-context')} context
 */
function initSerializers(context) {
  context.addInstance('applicationTokenSerializer', applicationTokenSerializer);
  context.addInstance('applicationTokenDeserializer', applicationTokenDeserializer);
}

/**
 * @param {import('./application-context')} context
 */
function initServices(context) {
  context.addInstance('logger', logger);
  context.addClass(Database);
  context.addClass(Dumper);
  context.addClass(Api);
  context.addClass(ApplicationTokenService);
  context.addClass(Authenticator);
  context.addClass(OidcAuthenticator);
  context.addClass(ErrorHandler);
}

/**
 * @param {import('./application-context')<Context>} context
 * @returns {import('./application-context')<Context>}
 */
function initContext(context) {
  initConstants(context);
  initEnv(context);
  initDependencies(context);
  initUtils(context);
  initSerializers(context);
  initServices(context);

  return context;
}

module.exports = initContext;
