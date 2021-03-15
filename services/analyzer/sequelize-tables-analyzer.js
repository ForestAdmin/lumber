const P = require('bluebird');
const _ = require('lodash');
const { plural, singular } = require('pluralize');
const ColumnTypeGetter = require('./sequelize-column-type-getter');
const DefaultValueExpression = require('./sequelize-default-value');
const TableConstraintsGetter = require('./sequelize-table-constraints-getter');
const EmptyDatabaseError = require('../../utils/errors/database/empty-database-error');
const { terminate } = require('../../utils/terminator');
const stringUtils = require('../../utils/strings');
const { isUnderscored } = require('../../utils/fields');

const ASSOCIATION_TYPE_BELONGS_TO = 'belongsTo';
const ASSOCIATION_TYPE_BELONGS_TO_MANY = 'belongsToMany';
const ASSOCIATION_TYPE_HAS_MANY = 'hasMany';
const ASSOCIATION_TYPE_HAS_ONE = 'hasOne';

const FOREIGN_KEY = 'FOREIGN KEY';

/** Queries database for default schema name */
async function getDefaultSchema(connection, userProvidedSchema) {
  if (userProvidedSchema) {
    return userProvidedSchema;
  }

  const dialect = connection.getDialect();
  const queries = {
    mssql: 'SELECT SCHEMA_NAME() AS default_schema',
    mysql: 'SELECT DATABASE() AS default_schema',
    mariadb: 'SELECT DATABASE() AS default_schema',
    postgres: 'SELECT CURRENT_SCHEMA() AS default_schema',
  };

  if (queries[dialect]) {
    const rows = await connection.query(
      queries[dialect],
      { type: connection.QueryTypes.SELECT },
    );

    return rows.length && rows[0].default_schema
      ? rows[0].default_schema : 'public';
  }

  return 'public';
}

/** Retrieve the description of the fields in a given table. */
async function analyzeFields(queryInterface, tableName, config) {
  const dialect = queryInterface.sequelize.getDialect();
  let columnsByName;

  // Workaround bug in sequelize/dialects/mysql/query-generator#describe
  // => Don't provide the schema when using mysql/mariadb
  if (['mysql', 'mariadb'].includes(dialect)) {
    columnsByName = await queryInterface.describeTable(tableName, {});
  } else {
    columnsByName = await queryInterface.describeTable(tableName, { schema: config.dbSchema });
  }

  // Workaround bug in sequelize/dialects/(postgres|mssql)/query.js#run()
  // => Fetch the unmodified default value from the information schema
  if (dialect === 'postgres' || dialect === 'mssql') {
    const getDefaultsQuery = `
      SELECT column_name as colname, column_default as coldefault
      FROM information_schema.columns
      WHERE table_schema = ? AND table_name = ?
    `;

    const rows = await queryInterface.sequelize.query(getDefaultsQuery, {
      type: queryInterface.sequelize.QueryTypes.SELECT,
      replacements: [config.dbSchema, tableName],
    });
    rows.forEach((row) => {
      columnsByName[row.colname].defaultValue = row.coldefault;
    });
  }

  Object.values(columnsByName).forEach((column) => {
    const defaultValue = new DefaultValueExpression(dialect, column.type, column.defaultValue);
    // eslint-disable-next-line no-param-reassign
    column.defaultValue = defaultValue.parse();
  });

  return columnsByName;
}

async function analyzePrimaryKeys(schema) {
  return Object.keys(schema).filter((column) => schema[column].primaryKey);
}

/** Retrieve table names from the provided schema. */
async function showAllTables(queryInterface, databaseConnection, schema) {
  const dbDialect = databaseConnection.getDialect();

  if (['mysql', 'mariadb'].includes(dbDialect)) {
    return queryInterface.showAllTables();
  }

  const tables = await queryInterface.sequelize.query(
    'SELECT table_name as table_name FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = ? AND table_type LIKE \'%TABLE\' AND table_name != \'spatial_ref_sys\'',
    { type: queryInterface.sequelize.QueryTypes.SELECT, replacements: [schema] },
  );

  return tables.map((table) => table.table_name);
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

function isTechnicalTimestamp({ type, name }) {
  // NOTICE: Ignore technical timestamp fields.
  const FIELDS_TO_IGNORE = [
    'createdAt', 'updatedAt', 'deletedAt',
    'createDate', 'updateDate', 'deleteDate',
    'creationDate', 'deletionDate',
  ];

  return type === 'DATE' && FIELDS_TO_IGNORE.includes(name);
}

function isJunctionTable(fields, constraints) {
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];

    // NOTICE: The only fields accepted are primary keys, technical timestamps and foreignKeys
    if (!isTechnicalTimestamp(field) && !field.primaryKey) {
      return false;
    }
  }

  const foreignKeys = constraints.filter((constraint) => constraint.foreignTableName
    && constraint.columnName
    && constraint.columnType === FOREIGN_KEY);
  // NOTICE: To be a junction table it means you have 2 foreignKeys, no more no less
  return foreignKeys.length === 2;
}

// NOTICE: Check the foreign key's reference unicity
function checkUnicity(primaryKeys, uniqueIndexes, columnName) {
  const isUnique = uniqueIndexes !== null
    && uniqueIndexes.find((indexColumnName) =>
      indexColumnName.length === 1 && indexColumnName.includes(columnName));

  const isPrimary = _.isEqual([columnName], primaryKeys);

  return isPrimary || isUnique;
}

function associationNameAlreadyExists(existingReferences, newReference) {
  return existingReferences.some((reference) => reference && reference.as === newReference.as);
}

function referenceAlreadyExists(existingReferences, newReference) {
  return existingReferences.some((reference) => (
    reference
    && reference.ref === newReference.ref
    && reference.association === newReference.association
    && reference.foreignKey === newReference.foreignKey
  ));
}

// NOTICE: Format the references depending on the type of the association
function createReference(
  tableName,
  existingsReferences,
  association,
  foreignKey,
  manyToManyForeignKey,
) {
  const foreignKeyName = _.camelCase(foreignKey.columnName);
  const reference = {
    foreignKey: foreignKey.columnName,
    foreignKeyName: `${foreignKeyName}Key`,
    association,
  };

  if (association === ASSOCIATION_TYPE_BELONGS_TO) {
    reference.ref = foreignKey.foreignTableName;
    reference.as = formatAliasName(foreignKey.columnName);
    if (foreignKey.foreignColumnName !== 'id') {
      reference.targetKey = foreignKey.foreignColumnName;
    }
  } else if (association === ASSOCIATION_TYPE_BELONGS_TO_MANY) {
    reference.ref = manyToManyForeignKey.foreignTableName;
    reference.otherKey = manyToManyForeignKey.columnName;
    reference.through = stringUtils.camelCase(
      stringUtils.transformToSafeString(foreignKey.tableName),
    );
    reference.as = _.camelCase(plural(`${manyToManyForeignKey.foreignTableName}_through_${foreignKey.tableName}`));
  } else {
    reference.ref = foreignKey.tableName;

    const formater = association === ASSOCIATION_TYPE_HAS_MANY ? plural : singular;
    const prefix = (singular(tableName) === formatAliasName(foreignKeyName))
      ? ''
      : `${formatAliasName(foreignKeyName)}_`;

    if (foreignKey.foreignColumnName !== 'id') {
      reference.sourceKey = foreignKey.foreignColumnName;
    }
    reference.as = _.camelCase(formater(`${prefix}${foreignKey.tableName}`));
  }

  if (referenceAlreadyExists(existingsReferences, reference)) return null;

  if (associationNameAlreadyExists(existingsReferences, reference)) {
    reference.as = _.camelCase(`${reference.as} ${reference.foreignKey}`);
  }

  return reference;
}

async function analyzeTable(queryInterface, tableConstraintsGetter, table, config) {
  const schema = await analyzeFields(queryInterface, table, config);

  return {
    schema,
    constraints: await tableConstraintsGetter.perform(table),
    primaryKeys: await analyzePrimaryKeys(schema),
  };
}

function createBelongsToReference(referenceTable, tableReferences, constraint) {
  const referenceColumnName = constraint.foreignColumnName;
  const referencePrimaryKeys = referenceTable.primaryKeys;
  const referenceUniqueConstraint = referenceTable.constraints
    .find(({ columnType }) => ['UNIQUE', 'PRIMARY KEY'].includes(columnType));
  const referenceUniqueIndexes = referenceUniqueConstraint
    ? referenceUniqueConstraint.uniqueIndexes
    : null;
  const isReferencePrimaryOrUnique = checkUnicity(
    referencePrimaryKeys,
    referenceUniqueIndexes,
    referenceColumnName,
  );

  if (isReferencePrimaryOrUnique) {
    return createReference(
      null,
      tableReferences,
      ASSOCIATION_TYPE_BELONGS_TO,
      constraint,
    );
  }
  return null;
}

// NOTICE: Use the foreign key and reference properties to determine the associations
//         and push them as references of the table.
function createAllReferences(databaseSchema, schemaGenerated) {
  const references = {};
  Object.keys(databaseSchema).forEach((tableName) => { references[tableName] = []; });

  Object.keys(databaseSchema).forEach((tableName) => {
    const table = databaseSchema[tableName];
    const { constraints, primaryKeys } = table;
    const { isJunction } = schemaGenerated[tableName].options;

    const foreignKeysWithExistingTable = constraints
      .filter((constraint) => constraint.columnType === FOREIGN_KEY
        && databaseSchema[constraint.foreignTableName]);

    foreignKeysWithExistingTable.forEach((constraint) => {
      const { columnName } = constraint;
      const uniqueIndexes = constraint.uniqueIndexes || null;

      const isPrimaryOrUnique = checkUnicity(primaryKeys, uniqueIndexes, columnName);

      const referenceTableName = constraint.foreignTableName;

      if (isJunction) {
        const manyToManyKeys = foreignKeysWithExistingTable
          .filter((otherKey) => otherKey.columnName !== constraint.columnName);

        manyToManyKeys.forEach((manyToManyKey) => {
          references[referenceTableName].push(
            createReference(
              referenceTableName,
              references[referenceTableName],
              ASSOCIATION_TYPE_BELONGS_TO_MANY,
              constraint,
              manyToManyKey,
            ),
          );
        });
      } else {
        references[referenceTableName].push(
          createReference(
            referenceTableName,
            references[referenceTableName],
            isPrimaryOrUnique ? ASSOCIATION_TYPE_HAS_ONE : ASSOCIATION_TYPE_HAS_MANY,
            constraint,
          ),
        );
      }

      references[tableName].push(
        createBelongsToReference(
          databaseSchema[referenceTableName],
          references[tableName],
          constraint,
        ),
      );
    });
  });

  // remove null references
  return Object.entries(references)
    .reduce(
      (accumulator, [tableName, tableReferences]) => {
        accumulator[tableName] = tableReferences.filter(Boolean);
        return accumulator;
      },
      {},
    );
}

function isOnlyJoinTableWithId(schema, constraints) {
  const idColumn = Object.keys(schema).find((columnName) => columnName === 'id');

  if (!idColumn) return false;

  const possibleForeignColumnNames = Object.keys(schema)
    .filter((columnName) => !isTechnicalTimestamp(schema[columnName]) && columnName !== 'id');

  const columnWithoutForeignKey = possibleForeignColumnNames
    .find((columnName) => !_.find(constraints, { columnName, columnType: FOREIGN_KEY }));

  return !columnWithoutForeignKey;
}

async function createTableSchema(columnTypeGetter, {
  schema,
  constraints,
  primaryKeys,
}, tableName) {
  const fields = [];

  await P.each(Object.keys(schema), async (columnName) => {
    const columnInfo = schema[columnName];
    const type = await columnTypeGetter.perform(columnInfo, columnName, tableName);
    const foreignKey = _.find(constraints, { columnName, columnType: FOREIGN_KEY });
    const isValidField = type && (!foreignKey
      || !foreignKey.foreignTableName
      || !foreignKey.columnName || columnInfo.primaryKey);
    // NOTICE: If the column is of integer type, named "id" and primary, Sequelize will handle it
    //         automatically without necessary declaration.
    const isIdIntegerPrimaryColumn = columnName === 'id'
      && ['INTEGER', 'BIGINT'].includes(type)
      && columnInfo.primaryKey;
    // NOTICE: But in some cases we want to force the id to be still generated.
    //         For example, Sequelize will not use a default id field on a model
    //         that has only foreign keys, so if the id primary key is present, we need to force it.
    const forceIdColumn = isIdIntegerPrimaryColumn && isOnlyJoinTableWithId(schema, constraints);

    if (isValidField && (!isIdIntegerPrimaryColumn || forceIdColumn)) {
      // NOTICE: sequelize considers column name with parenthesis as raw Attributes
      // do not try to camelCase the name for avoiding sequelize issues
      const hasParenthesis = columnName.includes('(') || columnName.includes(')');
      const name = hasParenthesis ? columnName : _.camelCase(columnName);
      let isRequired = !columnInfo.allowNull;
      if (isTechnicalTimestamp({ name, type })) {
        isRequired = false;
      }

      const field = {
        name,
        nameColumn: columnName,
        type,
        primaryKey: columnInfo.primaryKey,
        defaultValue: columnInfo.defaultValue,
        isRequired,
      };

      fields.push(field);
    }
  });

  const options = {
    underscored: isUnderscored(fields),
    timestamps: hasTimestamps(fields),
    hasIdColumn: hasIdColumn(fields, primaryKeys),
    hasPrimaryKeys: !_.isEmpty(primaryKeys),
    isJunction: isJunctionTable(fields, constraints),
  };

  return {
    fields,
    primaryKeys,
    options,
  };
}

// NOTICE: This detects two generated fields (regular or reference's alias) with the same name
//         and rename reference's alias as `Linked${collectionReferenced}` to prevent Sequelize
//         from crashing at startup.
function fixAliasConflicts(wholeSchema) {
  const tablesName = Object.keys(wholeSchema);

  if (!tablesName.length) { return; }

  tablesName.forEach((tableName) => {
    const table = wholeSchema[tableName];

    if (table.references.length && table.fields.length) {
      const fieldNames = table.fields.map((field) => field.name);

      table.references.forEach((reference, index) => {
        if (fieldNames.includes(reference.as)) {
          table.references[index].as = `linked${_.upperFirst(reference.as)}`;
        }
      });
    }
  });
}

async function analyzeSequelizeTables(connection, config, allowWarning) {
  // User provided a schema, check if it exists
  if (config.dbSchema) {
    const schemas = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?;',
      { type: connection.QueryTypes.SELECT, replacements: [config.dbSchema] },
    );

    if (!schemas.length) {
      const message = 'This schema does not exists.';

      return terminate(1, {
        errorCode: 'database_authentication_error',
        errorMessage: message,
        logs: [message],
      });
    }
  }

  // If dbSchema was not provided by user, get default one.
  const configWithSchema = {
    ...config,
    dbSchema: await getDefaultSchema(connection, config.dbSchema),
  };

  // Build the db schema.
  const schemaAllTables = {};
  const queryInterface = connection.getQueryInterface();
  const databaseSchema = {};
  const tableNames = await showAllTables(queryInterface, connection, configWithSchema.dbSchema);
  const constraintsGetter = new TableConstraintsGetter(connection, configWithSchema.dbSchema);

  await P.each(tableNames, async (tableName) => {
    const {
      schema,
      constraints,
      primaryKeys,
    } = await analyzeTable(queryInterface, constraintsGetter, tableName, configWithSchema);
    databaseSchema[tableName] = {
      schema, constraints, primaryKeys, references: [],
    };
  });

  const columnTypeGetter = new ColumnTypeGetter(
    connection, configWithSchema.dbSchema, allowWarning,
  );

  await P.each(tableNames, async (tableName) => {
    schemaAllTables[tableName] = await createTableSchema(
      columnTypeGetter,
      databaseSchema[tableName],
      tableName,
    );
  });

  // NOTICE: Fill the references field for each table schema
  const referencesPerTable = createAllReferences(databaseSchema, schemaAllTables);
  Object.keys(referencesPerTable).forEach((tableName) => {
    schemaAllTables[tableName].references = _.sortBy(referencesPerTable[tableName], 'association');

    // NOTE: When a table contains no field, it will be considered camelCased
    //       by default, so we need to check its references to ensure whether
    //       it is camelCased or not.
    if (!schemaAllTables[tableName].fields.length) {
      schemaAllTables[tableName].options.underscored = isUnderscored(
        schemaAllTables[tableName].references.map(({ foreignKey }) => ({ nameColumn: foreignKey })),
      );
    }
  });

  if (_.isEmpty(schemaAllTables)) {
    throw new EmptyDatabaseError('no tables found', {
      orm: 'sequelize',
      dialect: connection.getDialect(),
    });
  }

  fixAliasConflicts(schemaAllTables);

  return schemaAllTables;
}

module.exports = analyzeSequelizeTables;
