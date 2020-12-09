const Sequelize = require('sequelize');
const mongodb = require('mongodb');
const chalk = require('chalk');
const fs = require('fs');
const os = require('os');
const inquirer = require('inquirer');
const open = require('open');
const openIdClient = require('openid-client');
const Database = require('../services/database');
const logger = require('../services/logger');
const terminator = require('../utils/terminator');
const Api = require('../services/api');
const Authenticator = require('../services/authenticator');
const authenticatorHelper = require('../utils/authenticator-helper');
const OidcAuthenticator = require('../services/oidc/authenticator');
const ErrorHandler = require('../services/error-handler');
const messages = require('../utils/messages');

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
 *  fs: import('fs');
 *  os: import('os');
 *  chalk: import('chalk');
 *  inquirer: import('inquirer');
 *  mongodb: import('mongodb');
 *  Sequelize: import('sequelize');
 *  openIdClient: import('openid-client');
 *  open: import('open');
 * }} Dependencies
 *
 * @typedef {{
 *  terminator: import('../utils/terminator');
 *  authenticatorHelper: import('../utils/authenticator-helper');
 *  messages: import('../utils/messages');
 * }} Utils
 *
 * @typedef {{
 *  logger: import('../services/logger');
 *  database: import('../services/database');
 *  api: import('../services/api');
 *  authenticator: import('../services/authenticator');
 *  oidcAuthenticator: import('../services/oidc/authenticator');
 *  errorHandler: import('../services/error-handler');
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
  context.addInstance('open', open);
  context.addInstance('fs', fs);
  context.addInstance('os', os);
  context.addInstance('inquirer', inquirer);
  context.addInstance('Sequelize', Sequelize);
  context.addInstance('mongodb', mongodb);
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
function initServices(context) {
  context.addInstance('logger', logger);
  context.addClass(Database);
  context.addClass(Api);
  context.addClass(Authenticator);
  context.addClass(OidcAuthenticator);
  context.addClass(ErrorHandler);
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
