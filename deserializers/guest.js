const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

module.exports = new JSONAPIDeserializer({
  keyForAttribute: 'camelCase',
  projects: {
    valueForRelationship: (relationship, included) => included,
  },
});
