const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

module.exports = new JSONAPIDeserializer({
  keyForAttribute: 'camelCase',
  environments: {
    valueForRelationship: (relationship, included) => included,
  },
  renderings: {
    valueForRelationship: (relationship, included) => included,
  },
});
