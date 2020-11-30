const chalk = require('chalk');
const logger = require('../logger');

const DIALECT_MYSQL = 'mysql';
const DIALECT_POSTGRES = 'postgres';

const typeMatch = (type, value) => (type.match(value) || {}).input;
const typeStartsWith = (type, value) => typeMatch(type, new RegExp(`^${value}.*`, 'i'));
const typeContains = (type, value) => typeMatch(type, new RegExp(`${value}.*`, 'i'));

function ColumnTypeGetter(databaseConnection, schema, allowWarning = true) {
  const queryInterface = databaseConnection.getQueryInterface();

  function isDialect(dialect) {
    return queryInterface.sequelize.options.dialect === dialect;
  }

  function isColumnTypeEnum(columnName) {
    const type = queryInterface.sequelize.QueryTypes.SELECT;
    const query = `
      SELECT i.udt_name
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_catalog.pg_enum e ON t.oid = e.enumtypid
      LEFT JOIN INFORMATION_SCHEMA.columns i ON t.typname = i.udt_name
      WHERE i.column_name = :columnName OR t.typname = :columnName
      GROUP BY i.udt_name;
    `;
    const replacements = { columnName };

    return queryInterface.sequelize
      .query(query, { replacements, type })
      .then((result) => !!result.length);
  }

  function getTypeOfArrayForPostgres(table, columnName) {
    const type = queryInterface.sequelize.QueryTypes.SELECT;
    const query = `
      SELECT e.udt_name as "udtName",
        (CASE WHEN e.udt_name = 'hstore'
            THEN e.udt_name ELSE e.data_type END)
          || (CASE WHEN e.character_maximum_length IS NOT NULL
            THEN '(' || e.character_maximum_length || ')' ELSE '' END) as "type",
        (SELECT array_agg(en.enumlabel) FROM pg_catalog.pg_type t
          JOIN pg_catalog.pg_enum en
          ON t.oid = en.enumtypid
          WHERE t.typname = e.udt_name) AS "special"
      FROM INFORMATION_SCHEMA.columns c
      LEFT JOIN INFORMATION_SCHEMA.element_types e
      ON ((c.table_catalog, c.table_schema, c.table_name, 'TABLE', c.dtd_identifier) = (e.object_catalog, e.object_schema, e.object_name, e.object_type, e.collection_type_identifier))
      WHERE table_schema = :schema
        AND table_name = :table AND c.column_name = :columnName
    `;
    const replacements = { schema, table, columnName };

    return queryInterface.sequelize
      .query(query, { replacements, type })
      .then((result) => result[0])
      .then((info) => ({
        ...info,
        special: info.special ? info.special.slice(1, -1).split(',') : [],
      }));
  }

  async function getTypeForUserDefined(columnName, columnInfo) {
    const { special } = columnInfo;
    if (isDialect(DIALECT_POSTGRES) && await isColumnTypeEnum(columnName)) {
      return `ENUM(\n        '${special.join('\',\n        \'')}',\n      )`;
    }
    return 'STRING';
  }

  this.getTypeForArray = async (tableName, columnName) => {
    if (!isDialect(DIALECT_POSTGRES)) { return null; }
    const innerColumnInfo = await getTypeOfArrayForPostgres(tableName, columnName);
    return `ARRAY(DataTypes.${await this.perform(innerColumnInfo, innerColumnInfo.udtName, tableName)})`;
  };

  this.perform = async (columnInfo, columnName, tableName) => {
    const { type } = columnInfo;

    switch (type) {
      case 'JSON':
        return 'JSON';
      case (type === 'BIT(1)' && isDialect(DIALECT_MYSQL) && 'BIT(1)'): // NOTICE: MySQL boolean type.
      case 'BIT': // NOTICE: MSSQL type.
      case 'BOOLEAN':
        return 'BOOLEAN';
      case 'CHARACTER VARYING':
      case 'TEXT':
      case 'NTEXT': // MSSQL type
      case typeContains(type, 'TEXT'):
      case typeContains(type, 'VARCHAR'):
      case typeContains(type, 'CHAR'):
      case 'NVARCHAR': // NOTICE: MSSQL type.
        return 'STRING';
      case 'USER-DEFINED':
        return getTypeForUserDefined(columnName, columnInfo);
      case typeMatch(type, /ENUM\((.*)\)/i):
        return type;
      case 'UNIQUEIDENTIFIER':
      case 'UUID':
        return 'UUID';
      case 'JSONB':
        return 'JSONB';
      case 'INTEGER':
      case 'SERIAL':
      case 'BIGSERIAL':
      case typeStartsWith(type, 'INT'):
      case typeStartsWith(type, 'SMALLINT'):
      case typeStartsWith(type, 'TINYINT'):
      case typeStartsWith(type, 'MEDIUMINT'):
        return 'INTEGER';
      case typeStartsWith(type, 'BIGINT'):
        return 'BIGINT';
      case typeContains(type, 'FLOAT'):
        return 'FLOAT';
      case 'NUMERIC':
      case 'DECIMAL':
      case 'REAL':
      case 'DOUBLE':
      case 'DOUBLE PRECISION':
      case typeContains(type, 'DECIMAL'):
      case 'MONEY': // MSSQL type
        return 'DOUBLE';
      case 'DATE':
        return 'DATEONLY';
      case 'DATETIME':
      case typeStartsWith(type, 'TIMESTAMP'):
        return 'DATE';
      case 'TIME':
      case 'TIME WITHOUT TIME ZONE':
        return 'TIME';
      case 'ARRAY':
        return this.getTypeForArray(tableName, columnName);
      case 'INET':
        return 'INET';
      default:
        if (allowWarning) {
          logger.warn(`Type ${chalk.bold(type)} is not handled: The column ${chalk.bold(columnName)} won't be generated by lumber. If you need it please create it manually.`);
        }
        return null;
    }
  };
}

module.exports = ColumnTypeGetter;
