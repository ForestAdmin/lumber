'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Project(data) {
  return new JSONAPISerializer('projects', {
    attributes: ['name']
  }).serialize(data);
}

module.exports = Project;
