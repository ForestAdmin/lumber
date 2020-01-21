const _ = require('lodash');

module.exports = {
  pascalCase(input) {
    return _.chain(input).camelCase().upperFirst().value();
  },

  transformToSafeString(input) {
    if (/^[\d]/g.exec(input)) {
      return `Model${input}`;
    }
    return input;
  },
};
