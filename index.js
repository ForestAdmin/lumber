'use strict';
var P = require('bluebird');
var OptionParser = require('./services/options-parser');
var DB = require('./services/db');
var TableAnalyzer = require('./services/table-analyzer');
var Dumper = require('./services/dumper');

OptionParser
  .parse()
  .then((options) => new DB().connect(options))
  .then((db) => {
    let queryInterface = db.getQueryInterface();
    let tableAnalyzer = new TableAnalyzer(queryInterface);
    let dumper = new Dumper();

    return P
      .map(queryInterface.showAllTables(), (table) => {
        return tableAnalyzer
          .analyzeTable(table)
          .spread((fields, references) => {
            dumper.dump(table, fields, references);
          });
      });
  });
