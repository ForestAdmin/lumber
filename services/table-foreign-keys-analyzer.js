function TableForeignKeysAnalyzer(databaseConnection, schema) {
  const queryInterface = databaseConnection.getQueryInterface();

  this.perform = async (table) => {
    let query = null;
    const replacements = { table };

    switch (queryInterface.sequelize.options.dialect) {
      case 'postgres':
        query = `
        SELECT
          "tableConstraints".constraint_name AS "constraintName",
          "tableConstraints".table_name AS "tableName",
          "tableConstraints".constraint_type AS "columnType",
          "keyColumnUsage".column_name AS "columnName",
          "constraintColumnUsage".table_name AS "foreignTableName",
          "constraintColumnUsage".column_name AS "foreignColumnName",
          json_agg("uidx"."uniqueIndexes") filter (where "uidx"."uniqueIndexes" is not null) AS "uniqueIndexes"
        FROM information_schema.table_constraints AS "tableConstraints"
        JOIN information_schema.key_column_usage AS "keyColumnUsage"
          ON "tableConstraints".constraint_name = "keyColumnUsage".constraint_name
        JOIN information_schema.constraint_column_usage AS "constraintColumnUsage"
          ON "constraintColumnUsage".constraint_name = "tableConstraints".constraint_name
        FULL OUTER JOIN (
          -- Get the index name, table name and list of columns of the unique indexes of a table
          SELECT pg_index.indexrelid::regclass AS "indexName",
            "pgClass1".relname AS "tableName",
            json_agg(DISTINCT pg_attribute.attname) AS "uniqueIndexes"
          FROM
            pg_class AS "pgClass1",
            pg_class AS "pgClass2",
            pg_index,
            pg_attribute
          WHERE
            "pgClass1".relname = :table
            AND "pgClass1".oid = pg_index.indrelid
            AND "pgClass2".oid = pg_index.indexrelid
            AND pg_attribute.attrelid = "pgClass1".oid
            AND pg_attribute.attnum = ANY(pg_index.indkey)
            AND not pg_index.indisprimary
            AND pg_index.indisunique
            AND "pgClass1".relkind = 'r'
            AND not "pgClass1".relname like 'pg%'
            GROUP BY "tableName", "indexName"
        ) AS "uidx"
        ON "uidx"."tableName" = "tableConstraints".table_name
        WHERE "uidx"."tableName" = :table OR "tableConstraints".table_name = :table
        GROUP BY "constraintName", "tableConstraints".table_name, "columnType", "columnName", "foreignTableName", "foreignColumnName"`;
        break;
      case 'mysql':
        query = `
        SELECT constraintName,
               tableName,
               columnName,
               columnType,
               foreignTableName,
               foreignColumnName,
               CASE
                 WHEN cast('[null]' AS json) = uniqueIndexes THEN NULL
                 ELSE uniqueIndexes
               END AS uniqueIndexes
        FROM (
          SELECT tableConstraints.constraint_name AS constraintName,
                 tableConstraints.table_name AS tableName,
                 keyColumnUsage.column_name AS columnName,
                 tableConstraints.constraint_type AS columnType,
                 keyColumnUsage.referenced_table_name AS foreignTableName,
                 keyColumnUsage.referenced_column_name AS foreignColumnName,
                 JSON_ARRAYAGG(uidx.uniqueIndexes) AS uniqueIndexes
          FROM information_schema.table_constraints AS tableConstraints
          JOIN information_schema.key_column_usage AS keyColumnUsage
            ON tableConstraints.table_name = keyColumnUsage.table_name
            AND tableConstraints.constraint_name = keyColumnUsage.constraint_name
          LEFT OUTER JOIN (
            SELECT distinct uidx.index_name AS indexName,
                   uidx.table_name AS tableName,
                   JSON_ARRAYAGG(uidx.column_name) AS uniqueIndexes
            FROM information_schema.statistics AS uidx
            WHERE index_schema = 'lumber-sequelize-test'
              AND uidx.non_unique = 0
              AND uidx.index_name != 'PRIMARY'
            GROUP BY tableName, indexName) AS uidx
            ON uidx.tableName = tableConstraints.table_name
           WHERE tableConstraints.table_schema = 'lumber-sequelize-test'
              AND tableConstraints.table_name = 'addresses'
              AND tableConstraints.constraint_type != 'UNIQUE'
           GROUP BY constraintName, tableName, columnType, columnName, foreignTableName, foreignColumnName
        ) AS alias
        GROUP BY constraintName, tableName, columnType, columnName, foreignTableName, foreignColumnName, uniqueIndexes`;
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
