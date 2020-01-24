const _ = require('lodash');

module.exports = {
  pascalCase(input) {
    return _.chain(input).camelCase().upperFirst().value();
  },

  camelCase(input) {
    return _.camelCase(input);
  },

  transformToSafeString(input) {
    if (/^[\d]/g.exec(input)) {
      return `model${input}`;
    }
    return input;
  },
};
