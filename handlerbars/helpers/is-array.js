const Handlebars = require('handlebars');

Handlebars.registerHelper('isArray', (value) => {
  return Array.isArray(value);
});
