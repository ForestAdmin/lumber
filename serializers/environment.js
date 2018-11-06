const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Environment(data) {
  return new JSONAPISerializer('environments', {
    attributes: ['name', 'apiEndpoint', 'project'],
    project: {
      ref: 'id',
      included: false,
    },
  }).serialize(data);
}

module.exports = Environment;
