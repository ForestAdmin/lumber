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
            WHERE index_schema = :schemaName
              AND uidx.non_unique = 0
              AND uidx.index_name != 'PRIMARY'
            GROUP BY tableName, indexName) AS uidx
            ON uidx.tableName = tableConstraints.table_name
           WHERE tableConstraints.table_schema = :schemaName
              AND tableConstraints.table_name = :table
              AND tableConstraints.constraint_type != 'UNIQUE'
           GROUP BY constraintName, tableName, columnType, columnName, foreignTableName, foreignColumnName
        ) AS alias
        GROUP BY constraintName, tableName, columnType, columnName, foreignTableName, foreignColumnName, uniqueIndexes`;
        replacements.schemaName = queryInterface.sequelize.config.database;
        break;
      case 'mssql':
        query = `
        SELECT "constraintName",
          "tableName",
          "columnName",
          "columnType",
          "foreignTableName",
          "foreignColumnName",
          CASE 
            WHEN '[]' = "uniqueIndexes"
              THEN NULL
            ELSE "uniqueIndexes"
            END AS "uniqueIndexes"
        FROM (
          SELECT "constraintsTable"."constraintName",
            "constraintsTable"."tableName",
            "constraintsTable"."columnName",
            "constraintsTable"."columnType",
            "constraintsTable"."foreignTableName",
            "constraintsTable"."foreignColumnName",
            CONCAT (
              '[',
              STUFF((
                  SELECT ', ' + "constraintsAndIndexes"."uniqueIndexes"
                  FROM (
                    SELECT "constraintColumnUsage".constraint_name AS "constraintName",
                      "constraintColumnUsage".table_name AS "tableName",
                      "tableConstraints".constraint_type AS "columnType",
                      "constraintColumnUsage".column_name AS "columnName",
                      "keyColumnUsage".table_name AS "foreignTableName",
                      "keyColumnUsage".column_name AS "foreignColumnName",
                      "uidx"."uniqueIndexes"
                    FROM information_schema.table_constraints "tableConstraints"
                    JOIN information_schema.constraint_column_usage "constraintColumnUsage"
                      ON "constraintColumnUsage".constraint_name = "tableConstraints".constraint_name
                    LEFT OUTER JOIN information_schema.referential_constraints "referentialConstraints"
                      ON "constraintColumnUsage".constraint_name = "referentialConstraints".constraint_name
                    LEFT OUTER JOIN information_schema.key_column_usage "keyColumnUsage"
                      ON "keyColumnUsage".constraint_name = "referentialConstraints".unique_constraint_name
                    LEFT OUTER JOIN (
                      SELECT "indexesList1"."ind_name",
                        "indexesList1"."t_name",
                        CONCAT (
                          '[',
                          STUFF((
                              SELECT ', ' + CONCAT (
                                  '"',
                                  "indexesList2"."uniqueIndexes",
                                  '"'
                                  )
                              FROM (
                                SELECT "tables".name AS "t_name",
                                  "indexes".name AS "ind_name",
                                  "columns".name AS "uniqueIndexes"
                                FROM sys.indexes "indexes"
                                JOIN sys.index_columns "indexColumns"
                                  ON "indexes".object_id = "indexColumns".object_id
                                    AND "indexes".index_id = "indexColumns".index_id
                                JOIN sys.tables "tables"
                                  ON "indexes".object_id = "tables".object_id
                                JOIN sys.columns "columns"
                                  ON "indexColumns".object_id = "columns".object_id
                                    AND "indexColumns".column_id = "columns".column_id
                                WHERE "indexes".is_primary_key = 0
                                  AND (
                                    "indexes".is_unique = 1
                                    OR "indexes".is_unique_constraint = 1
                                    )
                                ) "indexesList2"
                              WHERE "indexesList2"."t_name" = "indexesList1"."t_name"
                                AND "indexesList2"."ind_name" = "indexesList1"."ind_name"
                              FOR XML PATH(''),
                                TYPE
                              ).value('.', 'varchar(max)'), 1, 2, ''),
                          ']'
                          ) AS "uniqueIndexes"
                      FROM (
                        SELECT "tables".name AS "t_name",
                          "indexes".name AS "ind_name",
                          "columns".name
                        FROM sys.indexes "indexes"
                        JOIN sys.index_columns "indexColumns"
                          ON "indexes".object_id = "indexColumns".object_id
                            AND "indexes".index_id = "indexColumns".index_id
                        JOIN sys.tables "tables"
                          ON "indexes".object_id = "tables".object_id
                        JOIN sys.columns "columns"
                          ON "indexColumns".object_id = "columns".object_id
                            AND "indexColumns".column_id = "columns".column_id
                        WHERE "indexes".is_primary_key = 0
                          AND (
                            "indexes".is_unique = 1
                            OR "indexes".is_unique_constraint = 1
                            )
                        ) "indexesList1"
                      GROUP BY "indexesList1"."t_name",
                        "indexesList1"."ind_name"
                      ) "uidx"
                      ON "uidx"."t_name" = "tableConstraints".table_name
                    WHERE "constraintColumnUsage".table_name = '${table}'
                      AND "constraintColumnUsage".table_schema = '${schema !== undefined ? schema : 'dbo'}'
                    ) "constraintsAndIndexes"
                  WHERE "constraintsTable"."constraintName" = "constraintsAndIndexes"."constraintName"
                    AND "constraintsTable"."tableName" = "constraintsAndIndexes"."tableName"
                    AND "constraintsTable"."columnType" = "constraintsAndIndexes"."columnType"
                    AND "constraintsTable"."columnName" = "constraintsAndIndexes"."columnName"
                    AND "constraintsTable"."foreignTableName" = "constraintsAndIndexes"."foreignTableName"
                    AND "constraintsTable"."foreignColumnName" = "constraintsAndIndexes"."foreignColumnName"
                  FOR XML PATH(''),
                    TYPE
                  ).value('.', 'varchar(max)'), 1, 2, ''),
              ']'
              ) AS "uniqueIndexes"
          FROM (
            SELECT "constraintColumnUsage".constraint_name AS "constraintName",
              "constraintColumnUsage".table_name AS "tableName",
              "tableConstraints".constraint_type AS "columnType",
              "constraintColumnUsage".column_name AS "columnName",
              "keyColumnUsage".table_name AS "foreignTableName",
              "keyColumnUsage".column_name AS "foreignColumnName"
            FROM information_schema.table_constraints "tableConstraints"
            JOIN information_schema.constraint_column_usage "constraintColumnUsage"
              ON "constraintColumnUsage".constraint_name = "tableConstraints".constraint_name
            LEFT OUTER JOIN information_schema.referential_constraints "referentialConstraints"
              ON "constraintColumnUsage".constraint_name = "referentialConstraints".constraint_name
            LEFT OUTER JOIN information_schema.key_column_usage "keyColumnUsage"
              ON "keyColumnUsage".constraint_name = "referentialConstraints".unique_constraint_name
            LEFT OUTER JOIN (
              SELECT "indexesList1"."ind_name",
                "indexesList1"."t_name",
                CONCAT (
                  '[',
                  STUFF((
                      SELECT ', ' + CONCAT (
                          '"',
                          "indexesList2"."uniqueIndexes",
                          '"'
                          )
                      FROM (
                        SELECT "tables".name AS "t_name",
                          "indexes".name AS "ind_name",
                          "columns".name AS "uniqueIndexes"
                        FROM sys.indexes "indexes"
                        JOIN sys.index_columns "indexColumns"
                          ON "indexes".object_id = "indexColumns".object_id
                            AND "indexes".index_id = "indexColumns".index_id
                        JOIN sys.tables "tables"
                          ON "indexes".object_id = "tables".object_id
                        JOIN sys.columns "columns"
                          ON "indexColumns".object_id = "columns".object_id
                            AND "indexColumns".column_id = "columns".column_id
                        WHERE "indexes".is_primary_key = 0
                          AND (
                            "indexes".is_unique = 1
                            OR "indexes".is_unique_constraint = 1
                            )
                        ) "indexesList2"
                      WHERE "indexesList2"."t_name" = "indexesList1"."t_name"
                        AND "indexesList2"."ind_name" = "indexesList1"."ind_name"
                      FOR XML PATH(''),
                        TYPE
                      ).value('.', 'varchar(max)'), 1, 2, ''),
                  ']'
                  ) AS "uniqueIndexes"
              FROM (
                SELECT "tables".name AS "t_name",
                  "indexes".name AS "ind_name",
                  "columns".name
                FROM sys.indexes "indexes"
                JOIN sys.index_columns "indexColumns"
                  ON "indexes".object_id = "indexColumns".object_id
                    AND "indexes".index_id = "indexColumns".index_id
                JOIN sys.tables "tables"
                  ON "indexes".object_id = "tables".object_id
                JOIN sys.columns "columns"
                  ON "indexColumns".object_id = "columns".object_id
                    AND "indexColumns".column_id = "columns".column_id
                WHERE "indexes".is_primary_key = 0
                  AND (
                    "indexes".is_unique = 1
                    OR "indexes".is_unique_constraint = 1
                    )
                ) "indexesList1"
              GROUP BY "indexesList1"."t_name",
                "indexesList1"."ind_name"
              ) "uidx"
              ON "uidx"."t_name" = "constraintColumnUsage".table_name
            WHERE "constraintColumnUsage".table_name = '${table}'
              AND "constraintColumnUsage".table_schema = '${schema !== undefined ? schema : 'dbo'}'
            ) AS "constraintsTable"
          WHERE "columnType" != 'UNIQUE'
          GROUP BY "constraintsTable"."constraintName",
            "constraintsTable"."tableName",
            "constraintsTable"."columnType",
            "constraintsTable"."columnName",
            "constraintsTable"."foreignTableName",
            "constraintsTable"."foreignColumnName"
          ) "alias"
        GROUP BY "constraintName",
          "tableName",
          "columnName",
          "columnType",
          "foreignTableName",
          "foreignColumnName",
          "uniqueIndexes"`;
        break;
      default:
        break;
    }

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT, replacements });
  };
}

module.exports = TableForeignKeysAnalyzer;
