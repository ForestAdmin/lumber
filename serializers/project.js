const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Project(data) {
  return new JSONAPISerializer('projects', {
    attributes: ['name'],
    keyForAttribute: 'underscore_case',
  }).serialize(data);
}

module.exports = Project;
