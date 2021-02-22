const _ = require('lodash');

function isUnderscored(fields) {
  if (!fields || !fields.length) return false;

  if (fields.length === 1 && fields[0].nameColumn === 'id') return true;

  return fields.every((field) => field.nameColumn === _.snakeCase(field.nameColumn))
    && fields.some((field) => field.nameColumn.includes('_'));
}

module.exports = {
  isUnderscored,
};
