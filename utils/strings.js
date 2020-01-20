const _ = require('lodash');

module.exports = {
  pascalCase(input) {
    if (/^[\d]/g.exec(input)) {
      return `Table${input}`;
    }

    return _.chain(input).camelCase().upperFirst().value();
  },
};
