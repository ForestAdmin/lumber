const Handlebars = require('handlebars');

const wrapQuotes = (value1) => `'${value1}'`;

Handlebars.registerHelper('wq', wrapQuotes);

module.exports = wrapQuotes;
