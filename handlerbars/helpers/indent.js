const Handlebars = require('handlebars');

Handlebars.registerHelper('indent', (level, value) => {
  return ' '.repeat(level * 2) + value;
});
