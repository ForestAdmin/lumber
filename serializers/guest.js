'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Guest(data) {
  return new JSONAPISerializer('guests', {
    attributes: ['email']
  }).serialize(data);
}

module.exports = Guest;
