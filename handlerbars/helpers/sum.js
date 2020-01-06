const Handlebars = require('handlebars');

Handlebars.registerHelper('sum', (value1, value2) => {
  return value1 + value2;
});
