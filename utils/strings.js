const _ = require('lodash');

module.exports = {
  pascalCase(input, upperFirst = true) {
    let transformedInput = _.chain(input).camelCase();
    if (upperFirst) {
      transformedInput = transformedInput.upperFirst();
    }
    return transformedInput.value();
  },

  transformToSafeString(input) {
    if (/^[\d]/g.exec(input)) {
      return `model${input}`;
    }
    return input;
  },
};
