const chalk = require('chalk');
const openIdClient = require('openid-client');
const logger = require('../services/logger');
const OidcAuthenticator = require('../services/oidc/authenticator');
const OidcErrorHandler = require('../services/oidc/error-handler');
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
 * }} EnvPart
 *
 * @typedef {{
 *  openIdClient: import('openid-client');
 *  chalk: import('chalk');
 * }} Dependencies
 *
 * @typedef {{
 *  terminator: import('../utils/terminator');
 *  messages: import('../utils/messages');
 * }} Utils
 *
 * @typedef {{
 *  logger: import('../services/logger');
 *  oidcAuthenticator: import('../services/oidc/authenticator');
 *  OidcErrorHandler: import('../services/oidc/error-handler');
 * }} Services
 *
 * @typedef {EnvPart & Dependencies & Utils & Services} Context
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
}

/**
 * @param {import('./application-context')} context
 */
function initDependencies(context) {
  context.addInstance('openIdClient', openIdClient);
  context.addInstance('chalk', chalk);
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
function initServices(context) {
  context.addInstance('logger', logger);
  context.addClass(OidcAuthenticator);
  context.addClass(OidcErrorHandler);
}

/**
 * @param {import('./application-context')<Context>} context
 * @returns {import('./application-context')<Context>}
 */
function initContext(context) {
  initEnv(context);
  initDependencies(context);
  initUtils(context);
  initServices(context);

  return context;
}

module.exports = initContext;
