const Handlebars = require('handlebars');

Handlebars.registerHelper('isObject', (value) => {
  return typeof value === 'object';
});
