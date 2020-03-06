const _ = require('lodash');

function tableToFilename(table) {
  return _.kebabCase(table);
}

module.exports = {
  tableToFilename,
};
