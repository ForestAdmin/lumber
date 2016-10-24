'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Environment(data) {
  return new JSONAPISerializer('environments', {
    attributes: ['apiEndpoint']
  }).serialize(data);
}

module.exports = Environment;
