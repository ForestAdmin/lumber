const generate = require('./app/generate');
const regenerateModels = require('./app/regenerate-models');
const update = require('./app/update');
const authenticator = require('./services/authenticator');

module.exports = {
  authenticator,
  generate,
  regenerateModels,
  update,
};
