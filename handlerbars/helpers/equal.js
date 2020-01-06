const Handlebars = require('handlebars');

Handlebars.registerHelper('eq', (value1, value2) => value1 === value2);
