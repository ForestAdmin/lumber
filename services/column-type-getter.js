function ColumnTypeGetter(databaseConnection) {
  const queryInterface = databaseConnection.getQueryInterface();

  function isColumnTypeEnum(columnName) {
    const query = `
      SELECT i.udt_name
      FROM pg_catalog.pg_type t
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      JOIN pg_catalog.pg_enum e ON t.oid = e.enumtypid
      JOIN information_schema.columns i ON t.typname = i.udt_name
      WHERE i.column_name = '${columnName}'
      GROUP BY i.udt_name;
    `;

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT })
      .then(result => !!result.length);
  }

  this.perform = async (columnInfo, columnName) => {
    const { type, special } = columnInfo;
    const mysqlEnumRegex = /ENUM\((.*)\)/i;

    switch (type) {
      case 'BIT': // NOTICE: MSSQL type.
      case 'BOOLEAN':
        return 'BOOLEAN';
      case 'CHARACTER VARYING':
      case 'TEXT':
      case 'NTEXT': // MSSQL type
      case (type.match(/TEXT.*/i) || {}).input:
      case (type.match(/VARCHAR.*/i) || {}).input:
      case (type.match(/CHAR.*/i) || {}).input:
      case 'NVARCHAR': // NOTICE: MSSQL type.
        return 'STRING';
      case 'USER-DEFINED': {
        if (queryInterface.sequelize.options.dialect === 'postgres' &&
          await isColumnTypeEnum(columnName)) {
          return `ENUM('${special.join('\', \'')}')`;
        }

        return 'STRING';
      }
      case (type.match(mysqlEnumRegex) || {}).input:
        return type;
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
      case (type.match(/FLOAT.*/i) || {}).input:
        return 'FLOAT';
      case 'NUMERIC':
      case 'DECIMAL':
      case 'REAL':
      case 'DOUBLE PRECISION':
      case (type.match(/DECIMAL.*/i) || {}).input:
      case 'MONEY': // MSSQL type
        return 'DOUBLE';
      case 'DATE':
      case 'DATETIME':
      case 'TIMESTAMP':
      case 'TIMESTAMP WITH TIME ZONE':
      case 'TIMESTAMP WITHOUT TIME ZONE':
        return 'DATE';
      default:
        return null;
    }
  };
}

module.exports = ColumnTypeGetter;
