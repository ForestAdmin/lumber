const { ObjectId } = require('mongodb');

/**
 * Retrieves simple mongoose type from value if detectable
 * Simple types are 'Date', 'Boolean', 'Number', 'String', 'Mongoose.Schema.Types.ObjectId'
 * @param value
 * @returns {string|null} return
 */
/* istanbul ignore next */
function getMongooseTypeFromValue(value) {
  if (typeof value === 'object' && value instanceof Date) {
    return 'Date';
  }

  if (typeof value === 'object' && value instanceof ObjectId) {
    return 'Mongoose.Schema.Types.ObjectId';
  }

  switch (typeof value) {
    case 'boolean':
      return 'Boolean';
    case 'number':
      return 'Number';
    case 'string':
      return 'String';
    default:
      return null;
  }
}

/**
 * Checks if the value corresponds to a mongoose type
 * @param value
 * @returns {boolean}
 */
/* istanbul ignore next */
function isOfMongooseType(value) {
  return !!getMongooseTypeFromValue(value);
}

module.exports = {
  getMongooseTypeFromValue,
  isOfMongooseType,
};
