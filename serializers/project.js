'use strict';
var JSONAPISerializer = require('jsonapi-serializer').Serializer;

function Project(data) {
  return new JSONAPISerializer('projects', {
    attributes: ['name', 'defaultEnvironment'],
    defaultEnvironment: {
      ref: 'id',
      included: false
    },
    typeForAttribute: function (type) {
      if (type === 'defaultEnvironment') { type = 'environments'; }
      return type;
    }
  }).serialize(data);
}

module.exports = Project;
