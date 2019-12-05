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

// NOTICE: Look for the id column in both fields and primary keys.
function hasIdColumn(fields, primaryKeys) {
  return fields.some((field) => field.name === 'id' || field.nameColumn === 'id')
    || _.includes(primaryKeys, 'id');
}

// NOTICE: Add isComposite, isUnique and isPrimary attributes to the foreign keys
async function setForeignKeys(schema, constraints, primaryKeys) {
  const foreignKeys = [];
  for (let index = 0; index < constraints.length; index += 1) {
    const foreignKey = constraints[index];
    const columnName = foreignKey.column_name;
    let uniqueIndexes = foreignKey.unique_indexes || null;

    // NOTICE: mssql doesn't support aggregation to JSON, we need to parse it
    if (uniqueIndexes !== null && uniqueIndexes === 'string') {
      uniqueIndexes = JSON.parse(uniqueIndexes);
    }

    if (foreignKey.column_type === 'FOREIGN KEY') {
      const hasUniqueConstraint = uniqueIndexes !== null
        && uniqueIndexes.length === 1
        && !!uniqueIndexes.some((indexColumnName) => {
          if (indexColumnName.length === 1) return indexColumnName.includes(columnName);
          return false;
        });

      foreignKey.isInCompositeKey = primaryKeys
        && primaryKeys.length > 1
        && primaryKeys.includes(columnName);

      foreignKey.isUnique = !!constraints.some((constraint) => constraint.column_name === columnName && constraint.column_type === 'UNIQUE')
        || hasUniqueConstraint;

      foreignKey.isPrimary = _.isEqual([columnName], primaryKeys);
    }
    foreignKeys.push(foreignKey);
  }

  return {
    schema, foreignKeys, primaryKeys, references: [],
  };
}

// NOTICE: Check the foreign key's reference unicity
function checkReferenceUnicity(primaryKeys, foreignKeys, columnName) {
  const isPrimary = primaryKeys.includes(columnName);
  const isUnique = !!_.find(foreignKeys, { column_name: columnName, column_type: 'UNIQUE' })
    || !!_.find(foreignKeys, { unique_indexes: columnName, column_type: 'PRIMARY KEY' });
  return isPrimary || isUnique;
}

// NOTICE: Format the references depending on the type of the association
function setReference(foreignKey, association, manyToManyForeignKey) {
  const reference = {
    foreignKey: foreignKey.column_name,
    foreignKeyName: _.camelCase(foreignKey.column_name),
    association,
  };
  if (association === 'belongsTo') {
    reference.isBelongsTo = true;
    reference.ref = foreignKey.foreign_table_name;
  } else if (association === 'belongsToMany') {
    reference.isBelongsToMany = true;
    reference.ref = foreignKey.table_name;
    reference.otherKey = manyToManyForeignKey.column_name;
    reference.junctionTable = manyToManyForeignKey.foreign_table_name;
  } else {
    reference.isHasOneOrHasMany = true;
    reference.ref = foreignKey.table_name;
  }

  // NOTICE: If the foreign key name and alias are the same, Sequelize will crash, we need
  //         to handle this specific scenario generating a different foreign key name.
  if (reference.foreignKeyName && reference.foreignKeyName === reference.as) {
    reference.foreignKeyName = `${reference.foreignKeyName}Key`;
  }

  if (foreignKey.foreign_column_name !== 'id') {
    reference.targetKey = foreignKey.foreign_column_name;
  }

  return reference;
}

function analyzeTable(table, config) {
  return P
    .resolve(analyzeFields(table, config))
    .then((schema) => P.all([
      schema,
      tableForeignKeysAnalyzer.perform(table),
      analyzePrimaryKeys(schema),
    ]))
    .then(([schema, foreignKeys, primaryKeys]) =>
      setForeignKeys(schema, foreignKeys, primaryKeys));
}

// NOTICE: Use the foreign key and reference properties to determine the associations
//         and push them as references of the table.
async function defineAssociationType(databaseSchema) {
  await P.mapSeries(Object.values(databaseSchema), async (table) => {
    const { foreignKeys } = table;
    foreignKeys.forEach((foreignKey) => {
      if (foreignKey.column_type === 'FOREIGN KEY') {
        const refTableName = foreignKey.foreign_table_name;
        const refColumnName = foreignKey.foreign_column_name;
        let isManyToMany = false;
        if (foreignKey.isInCompositeKey) {
          // Check if the foreignKey is in a composite primary key
          const { primaryKeys } = table;
          primaryKeys.forEach((primaryKey) => {
            if (primaryKey === foreignKey.column_name) {
              const manyToManyKeys = _.filter(foreignKeys, (otherKey) =>
                otherKey.column_name !== foreignKey.column_name
                  && otherKey.column_type === 'FOREIGN KEY' && primaryKeys.includes(otherKey.column_name)) || [];

              manyToManyKeys.forEach((manyToManyKey) => {
                databaseSchema[refTableName].references.push(setReference(foreignKey, 'belongsToMany', manyToManyKey));
              });
              isManyToMany = manyToManyKeys !== [];
            }
          });
        }
        if (!isManyToMany) {
          const refPrimaryKeys = databaseSchema[refTableName].primaryKeys;
          const refForeignKeys = databaseSchema[refTableName].foreignKeys;

          if (checkReferenceUnicity(refPrimaryKeys, refForeignKeys, refColumnName)) {
            table.references.push(setReference(foreignKey, 'belongsTo'));
          }
          databaseSchema[refTableName].references.push(
            setReference(
              foreignKey,
              foreignKey.isPrimary || foreignKey.isUnique ? 'hasOne' : 'hasMany',
            ),
          );
        }
      }
    });
  });
}

// NOTICE: Set the remaining fields
async function createTableSchema(schema, foreignKeys, primaryKeys, references, table) {
  const fields = [];
  await P.each(Object.keys(schema), async (nameColumn) => {
    const columnInfo = schema[nameColumn];
    const type = await columnTypeGetter.perform(columnInfo, nameColumn, table);
    const foreignKey = _.find(foreignKeys, { column_name: nameColumn, column_type: 'FOREIGN KEY' });

    if ((!foreignKey
          || !foreignKey.foreign_table_name
          || !foreignKey.column_name || columnInfo.primaryKey) && type) {
      // NOTICE: If the column is of integer type, named "id" and primary, Sequelize will
      //         handle it automatically without necessary declaration.
      if (nameColumn !== 'id' || type !== 'INTEGER' || !columnInfo.primaryKey) {
        // NOTICE: Handle bit(1) to boolean conversion
        if (columnInfo.defaultValue === "b'1'" || columnInfo.defaultValue === '((1))') { columnInfo.defaultValue = true; }
        if (columnInfo.defaultValue === "b'0'" || columnInfo.defaultValue === '((0))') { columnInfo.defaultValue = false; }

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
  const lianaSchema = {};

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
  const databaseSchema = {};
  await P.mapSeries(showAllTables(databaseConnection, config.dbSchema), async (table) => {
    databaseSchema[table] = await analyzeTable(table, config);
  });

  // Fill the references field for each table schemaÒ
  await defineAssociationType(databaseSchema);

  await P.mapSeries(showAllTables(databaseConnection, config.dbSchema), async (table) => {
    const {
      schema, foreignKeys, primaryKeys, references,
    } = databaseSchema[table];
    lianaSchema[table] = await createTableSchema(
      schema, foreignKeys, primaryKeys, references, table,
    );
  });

  if (_.isEmpty(lianaSchema)) {
    throw new DatabaseAnalyzerError.EmptyDatabase('no tables found', {
      orm: 'sequelize',
      dialect: databaseConnection.getDialect(),
    });
  }

  return lianaSchema;
}

module.exports = analyzeSequelizeTables;
