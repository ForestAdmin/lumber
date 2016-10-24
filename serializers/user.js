'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Guest(data) {
  return new JSONAPISerializer('users', {
    attributes: ['email', 'password', 'guest', 'projects'],
    guest: {
      ref: 'id',
      included: false
    },
    projects: {
      ref: 'id',
      included: false
    }
  }).serialize(data);
}

module.exports = Guest;
