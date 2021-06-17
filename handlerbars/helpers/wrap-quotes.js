const Handlebars = require('handlebars');

Handlebars.registerHelper('wq', (value1) => value1
  .indexOf(' ') > -1 ? `'${value1}'` : value1);
