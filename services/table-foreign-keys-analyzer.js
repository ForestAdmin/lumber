function TableForeignKeysAnalyzer(databaseConnection, schema) {
  const queryInterface = databaseConnection.getQueryInterface();

  this.perform = async (table) => {
    let query = null;
    const replacements = { table };

    switch (queryInterface.sequelize.options.dialect) {
      case 'postgres':
        query = `
        SELECT 
            table_constraints.constraint_name,
            table_constraints.table_name,
            table_constraints.constraint_type AS column_type,
            key_column_usage.column_name,
            constraint_column_usage.table_name AS foreign_table_name,
            constraint_column_usage.column_name AS foreign_column_name,
            json_agg(uidx.unique_indexes) filter (where uidx.unique_indexes is not null) AS unique_indexes
          FROM information_schema.table_constraints AS table_constraints
          JOIN information_schema.key_column_usage AS key_column_usage
            ON table_constraints.constraint_name = key_column_usage.constraint_name
          JOIN information_schema.constraint_column_usage AS constraint_column_usage
            ON constraint_column_usage.constraint_name = table_constraints.constraint_name
          FULL OUTER JOIN (
            SELECT pg_index.indexrelid::regclass AS index_name,
                pg_class.relname AS table_name,
                json_agg(DISTINCT pg_attribute.attname) AS unique_indexes
            FROM
                pg_class,
                pg_index,
                pg_attribute
            WHERE
                pg_class.oid = pg_index.indrelid
                AND pg_class.oid = pg_index.indexrelid
                AND pg_attribute.attrelid = pg_class.oid
                AND pg_attribute.attnum = ANY(pg_index.indkey)
                AND not pg_index.indisprimary
                AND pg_index.indisunique
                AND pg_class.relkind = 'r'
                AND not pg_class.relname like 'pg%'
            GROUP BY table_name, index_name) AS uidx
            ON uidx.table_name = table_constraints.table_name
          WHERE table_constraints.table_name=:table
          GROUP BY table_constraints.constraint_name, table_constraints.table_name, table_constraints.constraint_type, key_column_usage.column_name, foreign_table_name, foreign_column_name`;
        break;
      case 'mysql':
        query = `
          SELECT
            TABLE_NAME AS table_name,
            COLUMN_NAME AS column_name,CONSTRAINT_NAME AS constraint_name,
            REFERENCED_TABLE_NAME AS foreign_table_name,
            REFERENCED_COLUMN_NAME AS foreign_column_name
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = :databaseName
            AND TABLE_NAME = :table;`;
        replacements.databaseName = queryInterface.sequelize.config.database;
        break;
      case 'mssql':
        query = `
          SELECT
            fk.name AS constraint_name,
            OBJECT_NAME(fk.parent_object_id) AS table_name,
            c1.name AS column_name,
            OBJECT_NAME(fk.referenced_object_id) AS foreign_table_name,
            c2.name AS foreign_column_name
          FROM sys.foreign_keys fk
          INNER JOIN sys.foreign_key_columns fkc
            ON fkc.constraint_object_id = fk.object_id
          INNER JOIN sys.columns c1
            ON fkc.parent_column_id = c1.column_id
              AND fkc.parent_object_id = c1.object_id
          INNER JOIN sys.columns c2
            ON fkc.referenced_column_id = c2.column_id
              AND fkc.referenced_object_id = c2.object_id
          WHERE fk.parent_object_id = (SELECT object_id FROM sys.tables WHERE name = :table AND schema_id = SCHEMA_ID('${schema}'))`;
        break;
      default:
        break;
    }

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT, replacements });
  };
}

module.exports = TableForeignKeysAnalyzer;
