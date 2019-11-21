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

async function checkFkUnicity([schema, constraints, primaryKeys]) {
  // NOTICE: Add unique and primary attributes to the foreign keys
  const foreignKeys = [];

  for (let i = 0; i < constraints.length; i += 1) {
    const fk = constraints[i];
    if (fk.column_type === 'FOREIGN KEY') {
      fk.isInCompositeKey = (
        fk.unique_indexes !== null
        && (_.find(fk.unique_indexes, (array) => {
          if (array.length > 1) return array.includes(fk.column_name);
          return false;
        }) !== undefined)
        // && fk.unique_indexes.forEach()
      ) || (
        primaryKeys
        && primaryKeys.length > 1
        && primaryKeys.includes(fk.column_name)
      );

      fk.unique = _.find(constraints, { column_name: fk.column_name, column_type: 'UNIQUE' }) !== undefined
        || (
          fk.unique_indexes !== null
          && fk.unique_indexes.length === 1
        && _.find(fk.unique_indexes, (array) => {
          if (array.length === 1) return array.includes(fk.column_name);
          return false;
        }) !== undefined
        );

      fk.primary = _.isEqual([fk.column_name], primaryKeys);
    }
    foreignKeys.push(fk);
  }

  return [schema, foreignKeys, primaryKeys, []];
}

function checkRefUnicity(table, columnName) {
  const isPrimary = table[2].includes(columnName);
  const isUnique = _.find(table[1], { column_name: columnName, column_type: 'UNIQUE' }) !== undefined
    || _.find(table[1], { unique_indexes: columnName, column_type: 'PRIMARY KEY' }) !== undefined;
  return isPrimary || isUnique;
}

function setReference(fk, association, junctionTable) {
  let reference = {};
  if (association === 'belongsTo') {
    reference = {
      isBelongsTo: true,
      ref: fk.foreign_table_name,
      foreignKey: fk.column_name,
      foreignKeyName: _.camelCase(fk.column_name),
      as: formatAliasName(fk.column_name),
      association,
    };
  } else if (association !== 'belongsToMany') {
    reference = {
      isHasOneOrHasMany: true,
      ref: fk.table_name,
      association,
    };
  } else {
    reference = {
      isBelongsToMany: true,
      ref: fk.table_name,
      association,
      junctionTable,
    };
  }

  // NOTICE: If the foreign key name and alias are the same, Sequelize will crash, we need
  //         to handle this specific scenario generating a different foreign key name.
  if (reference.foreignKeyName === reference.as) {
    reference.foreignKeyName = `${reference.foreignKeyName}Key`;
  }

  if (fk.foreign_column_name !== 'id') {
    reference.targetKey = fk.foreign_column_name;
  }

  return reference;
}

function getData(table, config) {
  return P
    .resolve(analyzeFields(table, config))
    .then((schema) => P.all([
      schema,
      tableForeignKeysAnalyzer.perform(table),
      analyzePrimaryKeys(schema),
    ]))
    .then(data => checkFkUnicity(data));
}

async function setAssociationType(aggregatedData) {
  await P.mapSeries(Object.values(aggregatedData), async (table) => {
    table[1].forEach((fk) => {
      if (fk.column_type === 'FOREIGN KEY') {
        if (checkRefUnicity(aggregatedData[fk.foreign_table_name], fk.foreign_column_name)) {
          table[3].push(setReference(fk, 'belongsTo'));
        }
        if (fk.primary || fk.unique) aggregatedData[fk.foreign_table_name][3].push(setReference(fk, 'hasOne'));
        else aggregatedData[fk.foreign_table_name][3].push(setReference(fk, 'hasMany'));
        if (fk.isInCompositeKey) {
          const arrayUniqueIndexes = fk.unique_indexes === null ? [table[2]] : fk.unique_indexes;
          arrayUniqueIndexes.forEach((uniqueIndexes) => {
            if (uniqueIndexes.length > 1 && uniqueIndexes.includes(fk.column_name)) {
              const manyToManyKeys = _.filter(table[1], o => o.column_name !== fk.column_name && o.column_type === 'FOREIGN KEY' && uniqueIndexes.includes(o.column_name));
              if (manyToManyKeys !== null) {
                manyToManyKeys.forEach((foreignKey) => {
                  aggregatedData[fk.foreign_table_name][3].push(setReference(fk, 'belongsToMany', foreignKey.foreign_table_name));
                });
              }
            }
          });
        }
      }
    });
  });
}

async function analyzeTable([schema, foreignKeys, primaryKeys, references], table) {
  const fields = [];
  await P.each(Object.keys(schema), async (nameColumn) => {
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
