const P = require('bluebird');
const _ = require('lodash');
const { plural, singular } = require('pluralize');
const ColumnTypeGetter = require('./sequelize-column-type-getter');
const TableConstraintsGetter = require('./sequelize-table-constraints-getter');
const { DatabaseAnalyzerError } = require('../../utils/errors');
const { terminate } = require('../../utils/terminator');

const ASSOCIATION_TYPE_BELONGS_TO = 'belongsTo';
const ASSOCIATION_TYPE_BELONGS_TO_MANY = 'belongsToMany';
const ASSOCIATION_TYPE_HAS_MANY = 'hasMany';
const ASSOCIATION_TYPE_HAS_ONE = 'hasOne';

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

// NOTICE: Check the foreign key's reference unicity
function checkUnicity(primaryKeys, uniqueIndexes, columnName) {
  const isUnique = uniqueIndexes !== null
    && uniqueIndexes.find((indexColumnName) =>
      indexColumnName.length === 1 && indexColumnName.includes(columnName));

  const isPrimary = _.isEqual([columnName], primaryKeys);
  return { isPrimary, isUnique };
}

// NOTICE: Format the references depending on the type of the association
function createReference(tableName, association, foreignKey, manyToManyForeignKey) {
  const foreignKeyName = _.camelCase(foreignKey.columnName);
  const reference = {
    foreignKey: foreignKey.columnName,
    foreignKeyName: `${foreignKeyName}Key`,
    association,
  };

  if (association === ASSOCIATION_TYPE_BELONGS_TO) {
    reference.ref = foreignKey.foreignTableName;
    reference.as = formatAliasName(foreignKey.columnName);
  } else if (association === ASSOCIATION_TYPE_BELONGS_TO_MANY) {
    reference.ref = manyToManyForeignKey.foreignTableName;
    reference.otherKey = manyToManyForeignKey.columnName;
    reference.junctionTable = foreignKey.tableName;
  } else {
    reference.ref = foreignKey.tableName;

    const formater = association === ASSOCIATION_TYPE_HAS_MANY ? plural : singular;
    const prefix = (singular(tableName) === formatAliasName(foreignKeyName))
      ? ''
      : `${formatAliasName(foreignKeyName)}_`;

    reference.as = _.camelCase(formater(`${prefix}${foreignKey.tableName}`));
  }

  if (foreignKey.foreignColumnName !== 'id') {
    reference.targetKey = foreignKey.foreignColumnName;
  }

  return reference;
}

async function analyzeTable(table, config) {
  const schema = await analyzeFields(table, config);

  return {
    schema,
    constraints: await tableConstraintsGetter.perform(table),
    primaryKeys: await analyzePrimaryKeys(schema),
  };
}

// NOTICE: Use the foreign key and reference properties to determine the associations
//         and push them as references of the table.
function defineAssociationType(databaseSchema) {
  Object.values(databaseSchema).forEach((table) => {
    const { constraints, primaryKeys } = table;
    constraints.forEach((constraint) => {
      const { columnName } = constraint;
      const uniqueIndexes = constraint.uniqueIndexes || null;

      if (constraint.columnType === 'FOREIGN KEY') {
        const isInCompositeKey = primaryKeys
          && primaryKeys.length > 1
          && primaryKeys.includes(columnName);

        const { isPrimary, isUnique } = checkUnicity(primaryKeys, uniqueIndexes, columnName);

        const referenceTableName = constraint.foreignTableName;
        const referenceColumnName = constraint.foreignColumnName;
        let isManyToMany = false;

        if (isInCompositeKey) {
          // Check if the foreignKey is in a composite primary key
          primaryKeys.forEach((primaryKey) => {
            if (primaryKey === constraint.columnName) {
              const manyToManyKeys = _.filter(constraints, (otherKey) =>
                otherKey.columnName !== constraint.columnName
                  && otherKey.columnType === 'FOREIGN KEY' && primaryKeys.includes(otherKey.columnName)) || [];

              manyToManyKeys.forEach((manyToManyKey) => {
                databaseSchema[referenceTableName].references.push(
                  createReference(
                    referenceTableName,
                    ASSOCIATION_TYPE_BELONGS_TO_MANY,
                    constraint,
                    manyToManyKey,
                  ),
                );
              });
              isManyToMany = manyToManyKeys !== [];
            }
          });
        }
        if (!isManyToMany) {
          const referencePrimaryKeys = databaseSchema[referenceTableName].primaryKeys;
          const referenceUniqueConstraint = databaseSchema[referenceTableName].constraints
            .find(({ columnType }) => columnType === 'UNIQUE');
          const referenceUniqueIndexes = referenceUniqueConstraint
            ? referenceUniqueConstraint.uniqueIndexes
            : null;
          const referenceUnicity = checkUnicity(
            referencePrimaryKeys,
            referenceUniqueIndexes,
            referenceColumnName,
          );

          if (referenceUnicity.isPrimary || referenceUnicity.isUnique) {
            table.references.push(
              createReference(
                null,
                ASSOCIATION_TYPE_BELONGS_TO,
                constraint,
              ),
            );
          }
          databaseSchema[referenceTableName].references.push(
            createReference(
              referenceTableName,
              (isPrimary || isUnique) ? ASSOCIATION_TYPE_HAS_ONE : ASSOCIATION_TYPE_HAS_MANY,
              constraint,
            ),
          );
        }
      }
    });
  });
}

async function createTableSchema({
  schema,
  constraints,
  primaryKeys,
  references,
}, tableName) {
  const fields = [];

  await P.each(Object.keys(schema), async (columnName) => {
    const columnInfo = schema[columnName];
    const type = await columnTypeGetter.perform(columnInfo, columnName, tableName);
    const foreignKey = _.find(constraints, { columnName, columnType: 'FOREIGN KEY' });
    const isValidField = type && (!foreignKey
      || !foreignKey.foreignTableName
      || !foreignKey.columnName || columnInfo.primaryKey);

    if (isValidField) {
      // NOTICE: If the column is of integer type, named "id" and primary, Sequelize will
      //         handle it automatically without necessary declaration.
      if (!(columnName === 'id' && type === 'INTEGER' && columnInfo.primaryKey)) {
        // NOTICE: Handle bit(1) to boolean conversion
        let { defaultValue } = columnInfo;

        if (["b'1'", '((1))'].includes(defaultValue)) {
          defaultValue = true;
        }
        if (["b'0'", '((0))'].includes(defaultValue)) {
          defaultValue = false;
        }

        const field = {
          name: _.camelCase(columnName),
          nameColumn: columnName,
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
    references: _.sortBy(references, 'association'),
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
  const databaseSchema = {};
  const tableNames = await showAllTables(databaseConnection, config.dbSchema);

  await P.each(tableNames, async (tableName) => {
    const { schema, constraints, primaryKeys } = await analyzeTable(tableName, config);
    databaseSchema[tableName] = {
      schema,
      constraints,
      primaryKeys,
      references: [],
    };
  });

  // Fill the references field for each table schema
  defineAssociationType(databaseSchema);

  await P.each(tableNames, async (tableName) => {
    schemaAllTables[tableName] = await createTableSchema(databaseSchema[tableName], tableName);
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
