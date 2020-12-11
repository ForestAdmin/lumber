const JSONAPISerializer = require('jsonapi-serializer').Serializer;

/**
 * @typedef {{ name: string }} InputApplicationToken
 */

const applicationTokenSerializer = new JSONAPISerializer('application-tokens', {
  attributes: ['name'],
});

module.exports = applicationTokenSerializer;
