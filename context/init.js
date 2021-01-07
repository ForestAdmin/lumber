const Sequelize = require('sequelize');
const mongodb = require('mongodb');
const chalk = require('chalk');
const fs = require('fs');
const os = require('os');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');
const Handlebars = require('handlebars');
const Database = require('../services/database');
const Dumper = require('../services/dumper');
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
 *  mkdirp: import('mkdirp');
 *  mongodb: import('mongodb');
 *  Sequelize: import('sequelize');
 *  Handlebars: import('handlebars');
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
 *  dumper: import('../services/dumper');
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
    FOREST_URL: process.env.FOREST_URL || 'https://api.forestadmin.com',
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
  context.addInstance('mkdirp', mkdirp);
  context.addInstance('Sequelize', Sequelize);
  context.addInstance('mongodb', mongodb);
  context.addInstance('Handlebars', Handlebars);
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
  context.addClass(Dumper);
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
