const { ObjectId } = require('mongodb');

const PRIMITIVE_TYPES = ['string', 'number', 'boolean'];

function getPrimitiveType(value) {
  if (typeof value === 'object' && value instanceof Date) {
    return 'Date';
  }

  if (typeof value === 'object' && value instanceof ObjectId) {
    return 'mongoose.Schema.Types.ObjectId';
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

function isTypePrimitive(value) {
  if (typeof value === 'object' && value instanceof Date) {
    return true;
  }

  if (typeof value === 'object' && value instanceof ObjectId) {
    return true;
  }

  return PRIMITIVE_TYPES.indexOf(typeof value) > -1;
}

module.exports = {
  PRIMITIVE_TYPES,
  getPrimitiveType,
  isTypePrimitive,
};
