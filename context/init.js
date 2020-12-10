const Sequelize = require('sequelize');
const mongodb = require('mongodb');
const logger = require('../services/logger');
const terminator = require('../utils/terminator');

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
 *  logger: import('../services/logger');
 * }} Services
 *
 * @typedef {EnvPart & Services} Context
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
function initExternals(context) {
  context.addInstance('Sequelize', Sequelize);
  context.addInstance('mongodb', mongodb);
}

/**
 * @param {import('./application-context')} context
 */
function initUtils(context) {
  context.addInstance('terminator', terminator);
}

/**
 * @param {import('./application-context')} context
 */
function initServices(context) {
  context.addInstance('logger', logger);
}

/**
 * @param {import('./application-context')<Context>} context
 * @returns {import('./application-context')<Context>}
 */
function initContext(context) {
  initEnv(context);
  initExternals(context);
  initUtils(context);
  initServices(context);

  return context;
}

module.exports = initContext;
