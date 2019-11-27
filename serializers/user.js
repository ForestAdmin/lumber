const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function User(data) {
  return new JSONAPISerializer('users', {
    attributes: ['email', 'password', 'firstName', 'lastName'],
    keyForAttribute: 'underscore_case',
  }).serialize(data);
}

module.exports = User;
