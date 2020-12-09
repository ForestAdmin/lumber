const chalk = require('chalk');
const open = require('open');
const os = require('os');
const openIdClient = require('openid-client');
const superagent = require('superagent');
const pkg = require('../package.json');
const applicationTokenDeserializer = require('../deserializers/application-token');
const applicationTokenSerializer = require('../serializers/application-token');
const Api = require('../services/api');
const ApplicationTokenService = require('../services/application-token');
const logger = require('../services/logger');
const OidcAuthenticator = require('../services/oidc/authenticator');
const ErrorHandler = require('../services/error-handler');
const messages = require('../utils/messages');
const terminator = require('../utils/terminator');

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
 *  os: import('os');
 *  superagent: import('superagent');
 * }} Dependencies
 *
 * @typedef {{
 *  terminator: import('../utils/terminator');
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
 *  oidcAuthenticator: import('../services/oidc/authenticator');
 *  errorHandler: import('../services/error-handler');
 *  api: import('../services/api');
 *  applicationTokenService: import('../services/application-token');
 * }} Services
 *
 * @typedef {EnvPart & Dependencies & Utils & Serializers & Services} Context
 */

/**
 * @param {import('./application-context')} context
 */
function initEnv(context) {
  context.addInstance('env', {
    ...process.env,
    FOREST_URL: process.env.FOREST_URL || 'https://api.forestadmin.com',
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
  context.addInstance('os', os);
  context.addInstance('superagent', superagent);
}

/**
 * @param {import('./application-context')} context
 */
function initUtils(context) {
  context.addInstance('terminator', terminator);
  context.addInstance('messages', messages);
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
  context.addClass(OidcAuthenticator);
  context.addClass(ErrorHandler);
  context.addClass(Api);
  context.addClass(ApplicationTokenService);
}

/**
 * @param {import('./application-context')<Context>} context
 * @returns {import('./application-context')<Context>}
 */
function initContext(context) {
  initEnv(context);
  initDependencies(context);
  initUtils(context);
  initSerializers(context);
  initServices(context);

  return context;
}

module.exports = initContext;
