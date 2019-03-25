const generate = require('./app/generate');
const update = require('./app/update');
const authenticator = require('./services/authenticator');

module.exports = {
  authenticator,
  generate,
  update,
};
