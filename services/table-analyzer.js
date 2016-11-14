'use strict';
var _ = require('lodash');
var P = require('bluebird');

function TableAnalyzer(queryInterface, config) {
  function analyzeFields(table) {
    return queryInterface.describeTable(table);
  }

  function analyzeForeignKeys(table) {
    let query = null;

    switch (queryInterface.sequelize.options.dialect) {
      case 'postgres':
        query = `SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${table}';`;
        break;
      case 'mysql':
        query = `SELECT TABLE_NAME,COLUMN_NAME,CONSTRAINT_NAME, REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_SCHEMA = '${config.dbName}' AND REFERENCED_TABLE_NAME = '${table}';`;
        break;
    }

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT });
  }

  function getType(type) {
    switch (type) {
      case 'BOOLEAN':
        return 'BOOLEAN';
      case 'CHARACTER VARYING':
      case 'TEXT':
      case (type.match(/VARCHAR.*/i) || {}).input:
      case (type.match(/CHAR.*/i) || {}).input:
        return 'STRING';
      case 'JSONB':
        return 'JSONB';
      case 'SMALLINT':
      case 'INTEGER':
      case 'SERIAL':
      case 'BIGSERIAL':
      case (type.match(/INT.*/i) || {}).input:
      case (type.match(/TINYINT.*/i) || {}).input:
        return 'INTEGER';
      case 'BIGINT':
        return 'BIGINT';
      case 'NUMERIC':
      case 'DECIMAL':
      case 'REAL':
      case 'DOUBLE PRECISION':
      case (type.match(/DECIMAL.*/i) || {}).input:
        return 'DOUBLE';
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP WITH TIME ZONE':
      case 'TIMESTAMP WITHOUT TIME ZONE':
        return 'DATE';
    }
  }

  this.analyzeTable = function (table) {
    return new P
      .all([analyzeFields(table), analyzeForeignKeys(table)])
      .spread((schema, foreignKeys) => {
        var fields = [];
        var references = [];

        _.each(schema, (value, key) => {
          // jshint camelcase: false
          let type = getType(value.type);
          let foreignKey = _.find(foreignKeys, { 'column_name': key });

          if (foreignKey) {
            let ref = {
              ref: foreignKey.foreign_table_name,
              foreignKey: foreignKey.column_name,
              as: `rel${foreignKey.foreign_table_name}`
            };

            if (foreignKey.foreign_column_name !== 'id') {
              ref.targetKey = foreignKey.foreign_column_name;
            }

            references.push(ref);
          } else if (type && key !== 'id') {
            var opts = { name: key, type: type, primaryKey: value.primaryKey };
            fields.push(opts);
          }
        });

        return [fields, references];
      });
  };
}

module.exports = TableAnalyzer;
