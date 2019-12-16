const { ObjectId } = require('mongodb');

const PRIMITIVE_TYPE = ['string', 'number', 'boolean'];

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
      return undefined;
  }
}

function isTypePrimitive(value) {
  if (typeof value === 'object' && value instanceof Date) {
    return true;
  }

  if (typeof value === 'object' && value instanceof ObjectId) {
    return true;
  }

  return PRIMITIVE_TYPE.includes(typeof value);
}

module.exports = {
  getPrimitiveType,
  isTypePrimitive,
};
