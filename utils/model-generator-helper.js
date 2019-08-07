const _ = require('lodash');
const lodashInflection = require('lodash-inflection');

_.mixin(lodashInflection);

function hasTimestamps(fields) {
  let hasCreatedAt = false;
  let hasUpdatedAt = false;

  fields.forEach((f) => {
    if (_.camelCase(f.name) === 'createdAt') {
      hasCreatedAt = true;
    }

    if (_.camelCase(f.name) === 'updatedAt') {
      hasUpdatedAt = true;
    }
  });

  return hasCreatedAt && hasUpdatedAt;
}

function isUnderscored(fields) {
  let underscored = false;

  fields.forEach((field) => {
    if (field.name.includes('_')) { underscored = true; }
  });

  return underscored;
}

function getModelName(table) {
  const modelName = _.camelCase(_.singularize(table));
  return `${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}`;
}

module.exports = {
  hasTimestamps,
  isUnderscored,
  getModelName,
};
