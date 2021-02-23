const ApplicationContext = require('./application-context');

/** @type {import('./application-context')<import('./init').Context>} */
const context = new ApplicationContext();

module.exports = context;
