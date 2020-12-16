const Sequelize = require('sequelize');
const mongodb = require('mongodb');
const chalk = require('chalk');
const fs = require('fs');
const os = require('os');
const inquirer = require('inquirer');
const Database = require('../services/database');
const logger = require('../services/logger');
const terminator = require('../utils/terminator');
const Api = require('../services/api');
const Authenticator = require('../services/authenticator');
const authenticatorHelper = require('../utils/authenticator-helper');

/**
 * @typedef {{
 *   FOREST_URL: string;
 * }} Env
 *
 * @typedef {{
 *  env: Env
 * }} EnvPart
 *
 * @typedef {{
 *  fs: import('fs');
 *  os: import('os');
 *  chalk: import('chalk');
 *  inquirer: import('inquirer');
 *  mongodb: import('mongodb');
 *  Sequelize: import('sequelize');
 * }} Dependencies
 *
 * @typedef {{
 *  terminator: import('../utils/terminator');
 *  authenticatorHelper: import('../utils/authenticator-helper');
 * }} Utils
 *
 * @typedef {{
 *  logger: import('../services/logger');
 *  database: import('../services/database');
 *  api: import('../services/api');
 *  authenticator: import('../services/authenticator');
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
    FOREST_URL: process.env.FOREST_URL || 'https://app.forestadmin.com',
  });
}

/**
 * @param {import('./application-context')} context
 */
function initDependencies(context) {
  context.addInstance('fs', fs);
  context.addInstance('os', os);
  context.addInstance('chalk', chalk);
  context.addInstance('inquirer', inquirer);
  context.addInstance('Sequelize', Sequelize);
  context.addInstance('mongodb', mongodb);
}

/**
 * @param {import('./application-context')} context
 */
function initUtils(context) {
  context.addInstance('terminator', terminator);
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
