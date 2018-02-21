'use strict';
const _ = require('lodash');
const P = require('bluebird');

function TableAnalyzer(queryInterface, config) {
  function analyzeFields(table) {
    return queryInterface.describeTable(table, { schema: config.dbSchema });
  }

  function analyzeForeignKeys(table) {
    let query = null;

    switch (queryInterface.sequelize.options.dialect) {
      case 'postgres':
        query = `SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints AS tc JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='${table}';`;
        break;
      case 'mysql':
        query = `SELECT TABLE_NAME AS table_name,COLUMN_NAME AS column_name,CONSTRAINT_NAME AS constraint_name, REFERENCED_TABLE_NAME AS foreign_table_name,REFERENCED_COLUMN_NAME AS foreign_column_name FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${config.dbName}' AND TABLE_NAME = '${table}';`;
        break;
      case 'mssql':
        query = `SELECT fk.name AS constraint_name, OBJECT_NAME(fk.parent_object_id) AS table_name, c1.name AS column_name, OBJECT_NAME(fk.referenced_object_id) AS foreign_table_name, c2.name AS foreign_column_name FROM sys.foreign_keys fk INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id INNER JOIN sys.columns c1 ON fkc.parent_column_id = c1.column_id AND fkc.parent_object_id = c1.object_id INNER JOIN sys.columns c2 ON fkc.referenced_column_id = c2.column_id AND fkc.referenced_object_id = c2.object_id WHERE fk.parent_object_id = (SELECT object_id FROM sys.tables WHERE name = '${table}')`;
        break;
      case 'sqlite':
        query = `PRAGMA foreign_key_list('${table}');`;
        break;
    }

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT });
  }

  function getType(type) {
    switch (type) {
      case 'BIT': // MSSQL type
      case 'BOOLEAN':
        return 'BOOLEAN';
      case 'CHARACTER VARYING':
      case 'TEXT':
      case 'NTEXT': // MSSQL type
      case 'USER-DEFINED':
      case (type.match(/TEXT.*/i) || {}).input:
      case (type.match(/VARCHAR.*/i) || {}).input:
      case (type.match(/CHAR.*/i) || {}).input:
      case 'NVARCHAR': // MSSQL type
        return 'STRING';
      case 'UNIQUEIDENTIFIER':
      case 'UUID':
        return 'UUID';
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
      case 'MONEY': // MSSQL type
        return 'DOUBLE';
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
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

          if (foreignKey && foreignKey.foreign_table_name &&
            foreignKey.column_name && !value.primaryKey) {
            let ref = {
              ref: foreignKey.foreign_table_name,
              foreignKey: foreignKey.column_name,
              as: `_${foreignKey.column_name}`
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
