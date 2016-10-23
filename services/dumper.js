'use strict';
var fs = require('fs');
var _ = require('lodash');

function Dumper() {
  function isUnderscored(fields) {
    var underscored = false;

    fields.forEach((f) => {
      if (f.name.includes('_')) { underscored = true; }
    });

    return underscored;
  }

  function hasTimestamps(fields) {
    var hasCreatedAt = false;
    var hasUpdatedAt = false;

    fields.forEach((f) => {
      if (_.camelCase(f.name) === 'createdAt') {
        hasCreatedAt = true;
      }

      if (_.camelCase(f.name) === 'updatedAt') {
        hasUpdatedAt = true;
      }
    });

    return hasCreatedAt && hasUpdatedAt;
  }

  this.dump = function (table, fields, references) {
    var templatePath = `${__dirname}/../templates/model.txt`;
    var template = _.template(fs.readFileSync(templatePath, 'utf-8'));

    var text = template({
      table: table,
      fields: fields,
      references: references,
      underscored: isUnderscored(fields),
      timestamps: hasTimestamps(fields)
    });

    fs.writeFile('./models/' + table + '.js', text, (err) => {
      if (err) { throw err; }
      console.log('.');
    });
  };
}

module.exports = Dumper;
