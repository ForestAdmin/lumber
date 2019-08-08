const _ = require('lodash');
const lodashInflection = require('lodash-inflection');

_.mixin(lodashInflection);

function getModelName(table) {
  const modelName = _.camelCase(_.singularize(table));
  return `${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}`;
}

module.exports = {
  getModelName,
};
