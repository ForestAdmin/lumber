const JSONAPIDeserializer = require('jsonapi-serializer').Deserializer;

/**
 * @typedef {{
 *  id: string;
 *  name: string;
 *  token: string;
 * }} ApplicationToken
 */

const applicationTokenDeserializer = new JSONAPIDeserializer({
  keyForAttribute: 'camelCase',
});

module.exports = applicationTokenDeserializer;
