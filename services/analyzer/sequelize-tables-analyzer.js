const P = require('bluebird');
const _ = require('lodash');
const ColumnTypeGetter = require('./sequelize-column-type-getter');
const TableConstraintsGetter = require('./sequelize-table-constraints-getter');
const { DatabaseAnalyzerError } = require('../../utils/errors');
const { terminate } = require('../../utils/terminator');

let queryInterface;
let tableConstraintsGetter;
let columnTypeGetter;

function isUnderscored(fields) {
  return fields.every((field) => field.nameColumn === _.snakeCase(field.nameColumn))
    && fields.some((field) => field.nameColumn.includes('_'));
}

function analyzeFields(table, config) {
  return queryInterface.describeTable(table, { schema: config.dbSchema });
}

async function analyzePrimaryKeys(schema) {
  return Object.keys(schema).filter((column) => schema[column].primaryKey);
}

async function showAllTables(databaseConnection, schema) {
  const dbDialect = databaseConnection.getDialect();

  if (['mysql', 'mariadb'].includes(dbDialect)) {
    return queryInterface.showAllTables();
  }

  let realSchema = schema;
  if (!realSchema) {
    if (dbDialect === 'mssql') {
      [{ default_schema: realSchema }] = await queryInterface.sequelize.query('SELECT SCHEMA_NAME() as default_schema', { type: queryInterface.sequelize.QueryTypes.SELECT });
    } else {
      realSchema = 'public';
    }
  }

  return queryInterface.sequelize.query(
    'SELECT table_name as table_name FROM information_schema.tables WHERE table_schema = ? AND table_type LIKE \'%TABLE\' AND table_name != \'spatial_ref_sys\'',
    { type: queryInterface.sequelize.QueryTypes.SELECT, replacements: [realSchema] },
  )
    .then((results) => results.map((table) => table.table_name));
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
  }
  if (alias.endsWith('Uuid') && alias.length > 4) {
    return alias.substring(0, alias.length - 4);
  }
  return alias;
}

// NOTICE: Look for the id column in both fields and primary keys.
function hasIdColumn(fields, primaryKeys) {
  return fields.some((field) => field.name === 'id' || field.nameColumn === 'id')
    || _.includes(primaryKeys, 'id');
}

async function analyzeTable(table, config) {
  const schema = await analyzeFields(table, config);

  return {
    schema,
    foreignKeys: await tableConstraintsGetter.perform(table),
    primaryKeys: await analyzePrimaryKeys(schema),
  };
}

async function createTableSchema({ schema, foreignKeys, primaryKeys }, tableName) {
  const fields = [];
  const references = [];

  await P.each(Object.keys(schema), async (nameColumn) => {
    const columnInfo = schema[nameColumn];
    const type = await columnTypeGetter.perform(columnInfo, nameColumn, tableName);
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
        // NOTICE: Handle bit(1) to boolean conversion
        let { defaultValue } = columnInfo;

        if (["b'1'", '((1))'].includes(defaultValue)) {
          defaultValue = true;
        }
        if (["b'0'", '((0))'].includes(defaultValue)) {
          defaultValue = false;
        }

        const field = {
          name: _.camelCase(nameColumn),
          nameColumn,
          type,
          primaryKey: columnInfo.primaryKey,
          defaultValue,
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
}

async function analyzeSequelizeTables(databaseConnection, config, allowWarning) {
  const schemaAllTables = {};

  queryInterface = databaseConnection.getQueryInterface();
  tableConstraintsGetter = new TableConstraintsGetter(databaseConnection, config.dbSchema);
  columnTypeGetter = new ColumnTypeGetter(databaseConnection, config.dbSchema || 'public', allowWarning);

  if (config.dbSchema) {
    const schemaExists = await queryInterface.sequelize
      .query(
        'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?;',
        { type: queryInterface.sequelize.QueryTypes.SELECT, replacements: [config.dbSchema] },
      )
      .then((result) => !!result.length);

    if (!schemaExists) {
      const message = 'This schema does not exists.';
      return terminate(1, {
        errorCode: 'database_authentication_error',
        errorMessage: message,
        logs: [message],
      });
    }
  }

  // Build the db schema.
  const tableNames = await showAllTables(databaseConnection, config.dbSchema);

  await P.each(tableNames, async (tableName) => {
    const tableAnalysis = await analyzeTable(tableName, config);
    schemaAllTables[tableName] = await createTableSchema(tableAnalysis, tableName);
  });

  if (_.isEmpty(schemaAllTables)) {
    throw new DatabaseAnalyzerError.EmptyDatabase('no tables found', {
      orm: 'sequelize',
      dialect: databaseConnection.getDialect(),
    });
  }

  return schemaAllTables;
}

module.exports = analyzeSequelizeTables;
