const P = require('bluebird');
const _ = require('lodash');
const logger = require('./logger');
const ColumnTypeGetter = require('./column-type-getter');
const TableForeignKeysAnalyzer = require('./table-foreign-keys-analyzer');
const { DatabaseAnalyzerError } = require('../utils/errors');

let queryInterface;
let tableForeignKeysAnalyzer;
let columnTypeGetter;

function isUnderscored(fields) {
  return fields.every(field => field.nameColumn === _.snakeCase(field.nameColumn))
    && fields.some(field => field.nameColumn.includes('_'));
}

function analyzeFields(table, config) {
  return queryInterface.describeTable(table, { schema: config.dbSchema });
}

async function analyzePrimaryKeys(schema) {
  return Object.keys(schema).filter(column => schema[column].primaryKey);
}

function hasTimestamps(fields) {
  let hasCreatedAt = false;
  let hasUpdatedAt = false;

  fields.forEach((field) => {
    if (field.name === 'createdAt') {
      hasCreatedAt = true;
    }

    if (field.name === 'updatedAt') {
      hasUpdatedAt = true;
    }
  });

  return hasCreatedAt && hasUpdatedAt;
}

function formatAliasName(columnName) {
  const alias = _.camelCase(columnName);
  if (alias.endsWith('Id') && alias.length > 2) {
    return alias.substring(0, alias.length - 2);
  } else if (alias.endsWith('Uuid') && alias.length > 4) {
    return alias.substring(0, alias.length - 4);
  }
  return alias;
}

// NOTICE: Look for the id column in both fields and primary keys.
function hasIdColumn(fields, primaryKeys) {
  return fields.some(field => field.name === 'id' || field.nameColumn === 'id')
    || _.includes(primaryKeys, 'id');
}

function analyzeTable(table, config) {
  return P
    .resolve(analyzeFields(table, config))
    .then(schema => P.all([
      schema,
      tableForeignKeysAnalyzer.perform(table),
      analyzePrimaryKeys(schema),
    ]))
    .spread(async (schema, foreignKeys, primaryKeys) => {
      const fields = [];
      const references = [];

      await P.each(Object.keys(schema), async (nameColumn) => {
        const columnInfo = schema[nameColumn];
        const type = await columnTypeGetter.perform(columnInfo, nameColumn, table);
        const foreignKey = _.find(foreignKeys, { column_name: nameColumn });

        if (foreignKey
          && foreignKey.foreign_table_name
          && foreignKey.column_name
          && !columnInfo.primaryKey) {
          const reference = {
            ref: foreignKey.foreign_table_name,
            foreignKey: foreignKey.column_name,
            foreignKeyName: _.camelCase(foreignKey.column_name),
            as: formatAliasName(foreignKey.column_name),
          };

          // NOTICE: If the foreign key name and alias are the same, Sequelize will crash, we need
          //         to handle this specific scenario generating a different foreign key name.
          if (reference.foreignKeyName === reference.as) {
            reference.foreignKeyName = `${reference.foreignKeyName}Key`;
          }

          if (foreignKey.foreign_column_name !== 'id') {
            reference.targetKey = foreignKey.foreign_column_name;
          }

          references.push(reference);
        } else if (type) {
          // NOTICE: If the column is of integer type, named "id" and primary, Sequelize will
          //         handle it automatically without necessary declaration.
          if (!(nameColumn === 'id' && type === 'INTEGER' && columnInfo.primaryKey)) {
            const field = {
              name: _.camelCase(nameColumn),
              nameColumn,
              type,
              primaryKey: columnInfo.primaryKey,
              defaultValue: columnInfo.defaultValue,
            };

            fields.push(field);
          }
        }
      });

      const options = {
        underscored: isUnderscored(fields),
        timestamps: hasTimestamps(fields),
        hasIdColumn: hasIdColumn(fields, primaryKeys),
        hasPrimaryKeys: !_.isEmpty(primaryKeys),
      };

      return {
        fields,
        references,
        primaryKeys,
        options,
      };
    });
}

async function analyzeSequelizeTables(databaseConnection, config, allowWarning) {
  const schema = {};

  queryInterface = databaseConnection.getQueryInterface();
  tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection);
  columnTypeGetter = new ColumnTypeGetter(databaseConnection, config.dbSchema || 'public', allowWarning);

  if (config.dbSchema) {
    const schemaExists = await queryInterface.sequelize
      .query(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?;',
        { type: queryInterface.sequelize.QueryTypes.SELECT, replacements: [config.dbSchema] },
      )
      .then(result => !!result.length);

    if (!schemaExists) {
      logger.error('This schema does not exists.');
      return process.exit(1);
    }
  }

  // Build the db schema.
  await P.mapSeries(queryInterface.showAllTables({
    schema: config.dbSchema,
  }), async (table) => {
    // NOTICE: MS SQL returns objects instead of strings.
    if (typeof table === 'object') {
      // eslint-disable-next-line no-param-reassign
      table = table.tableName;
    }

    schema[table] = await analyzeTable(table, config);
  });

  if (_.isEmpty(schema)) {
    throw new DatabaseAnalyzerError.EmptyDatabase('no tables found', {
      orm: 'sequelize',
      dialect: databaseConnection.getDialect(),
    });
  }

  return schema;
}

module.exports = analyzeSequelizeTables;
