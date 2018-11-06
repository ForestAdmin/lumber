const JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Project(data) {
  return new JSONAPISerializer('projects', {
    attributes: ['name', 'defaultEnvironment'],
    defaultEnvironment: {
      ref: 'id',
      included: false,
    },
    typeForAttribute: (type) => {
      if (type === 'defaultEnvironment') { return 'environments'; }
      return type;
    },
  }).serialize(data);
}

module.exports = Project;
