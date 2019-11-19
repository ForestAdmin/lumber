const P = require('bluebird');
const _ = require('lodash');
const ColumnTypeGetter = require('./column-type-getter');
const TableForeignKeysAnalyzer = require('./table-foreign-keys-analyzer');
const { DatabaseAnalyzerError } = require('../utils/errors');
const { terminate } = require('../utils/terminator');

let queryInterface;
let tableForeignKeysAnalyzer;
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

async function labelFK([schema, constraints, primaryKeys]) {
  // NOTICE: Add unique and primary attributes to the foreign keys
  const foreignKeys = [];
  for (let i = 0; i < constraints.length; i += 1) {
    const fk = constraints[i];
    if (fk.column_type === 'FOREIGN KEY') {
      fk.unique = _.find(constraints, { column_name: fk.column_name, column_type: 'UNIQUE' }) !== undefined;
      fk.primary = primaryKeys.includes(fk.column_name);
    }
    foreignKeys.push(fk);
  }

  return [schema, foreignKeys, primaryKeys, []];
}

function getData(table, config) {
  return P
    .resolve(analyzeFields(table, config))
    .then((schema) => P.all([
      schema,
      tableForeignKeysAnalyzer.perform(table),
      analyzePrimaryKeys(schema),
    ]))
    .then(data => labelFK(data));
}

async function setAssociationType(aggregatedData) {
  await P.mapSeries(Object.values(aggregatedData), async (table) => {
    table[1].forEach((fk) => {
      if (fk.column_type === 'FOREIGN KEY') {
        const primary = aggregatedData[fk.foreign_table_name][2].includes(fk.foreign_column_name);
        const unique = _.find(aggregatedData[fk.foreign_table_name][1], { column_name: fk.foreign_column_name, column_type: 'UNIQUE' });
        if (primary || unique) { // then belongs to
          const reference = {
            ref: fk.foreign_table_name,
            foreignKey: fk.column_name,
            foreignKeyName: _.camelCase(fk.column_name),
            as: formatAliasName(fk.column_name),
            association: 'belongsTo',
          };

          // NOTICE: If the foreign key name and alias are the same, Sequelize will crash, we need
          //         to handle this specific scenario generating a different foreign key name.
          if (reference.foreignKeyName === reference.as) {
            reference.foreignKeyName = `${reference.foreignKeyName}Key`;
          }

          if (fk.foreign_column_name !== 'id') {
            reference.targetKey = fk.foreign_column_name;
          }

          table[3].push(reference);
        }
        let association;
        if (fk.primary || fk.unique) { // then hasOne
          association = 'hasOne';
        } else {
          association = 'hasMany';
        }
        const reference = {
          ref: fk.table_name,
          foreignKey: fk.foreign_column_name,
          foreignKeyName: _.camelCase(fk.foreign_column_name),
          as: formatAliasName(fk.foreign_column_name),
          association,
        };

        // NOTICE: If the foreign key name and alias are the same, Sequelize will crash, we need
        //         to handle this specific scenario generating a different foreign key name.
        if (reference.foreignKeyName === reference.as) {
          reference.foreignKeyName = `${reference.foreignKeyName}Key`;
        }

        if (fk.foreign_column_name !== 'id') {
          reference.targetKey = fk.foreign_column_name;
        }

        aggregatedData[fk.foreign_table_name][3].push(reference);
      }
    });
  });
}

async function analyzeTable([schema, foreignKeys, primaryKeys, references], table) {
  const fields = [];

  console.log(foreignKeys);
  console.log(primaryKeys);

  await P.each(Object.keys(schema), async (nameColumn) => {
    console.log(nameColumn);
    const columnInfo = schema[nameColumn];
    const type = await columnTypeGetter.perform(columnInfo, nameColumn, table);
    const foreignKey = _.find(foreignKeys, { column_name: nameColumn, column_type: 'FOREIGN KEY' });
    if (!(foreignKey
          && foreignKey.foreign_table_name
          && foreignKey.column_name) && type) {
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
}

async function analyzeSequelizeTables(databaseConnection, config, allowWarning) {
  const schema = {};

  queryInterface = databaseConnection.getQueryInterface();
  tableForeignKeysAnalyzer = new TableForeignKeysAnalyzer(databaseConnection, config.dbSchema);

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
  const aggregatedData = {};
  await P.mapSeries(showAllTables(databaseConnection, config.dbSchema), async (table) => {
    aggregatedData[table] = await getData(table, config);
  });

  await setAssociationType(aggregatedData);
  await P.mapSeries(showAllTables(databaseConnection, config.dbSchema), async (table) => {
    schema[table] = await analyzeTable(aggregatedData[table], table);
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
