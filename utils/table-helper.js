const _ = require('lodash');

// NOTICE: Look for the id column in both fields and primary keys
function hasIdColumn(fields, primaryKeys) {
  return fields.some(field => field.name === 'id' || field.nameColumn === 'id') ||
        _.includes(primaryKeys, 'id');
}

module.exports = {
  hasIdColumn,
};
