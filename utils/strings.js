const _ = require('lodash');

module.exports = {
  pascalCase(input) {
    return _.chain(input).camelCase().upperFirst().value();
  },
};
