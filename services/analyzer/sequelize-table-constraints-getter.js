const MysqlTableConstraintsGetter = require('./mysql-table-constraints-getter');

function TableConstraintsGetter(databaseConnection, schema) {
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
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS "tableConstraints"
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS "keyColumnUsage"
            ON "tableConstraints".constraint_name = "keyColumnUsage".constraint_name
          JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS "constraintColumnUsage"
            ON "constraintColumnUsage".constraint_name = "tableConstraints".constraint_name
          FULL OUTER JOIN (
            -- Get the index name, table name and list of columns of the unique indexes of a table
            SELECT
              pg_index.indexrelid::regclass AS "indexName",
              "pgClass1".relname AS "tableName",
              json_agg(DISTINCT pg_attribute.attname) AS "uniqueIndexes"
            FROM
              pg_class AS "pgClass1",
              pg_class AS "pgClass2",
              pg_index,
              pg_attribute
            WHERE "pgClass1".relname = :table
              AND "pgClass1".oid = pg_index.indrelid
              AND "pgClass2".oid = pg_index.indexrelid
              AND pg_attribute.attrelid = "pgClass1".oid
              AND pg_attribute.attnum = ANY(pg_index.indkey)
              AND not pg_index.indisprimary
              AND pg_index.indisunique
              AND "pgClass1".relkind = 'r'
              AND not "pgClass1".relname like 'pg%'
              GROUP BY
                "tableName",
                "indexName"
          ) AS "uidx"
            ON "uidx"."tableName" = "tableConstraints".table_name
          WHERE "uidx"."tableName" = :table
            OR "tableConstraints".table_name = :table
          GROUP BY
            "constraintName",
            "tableConstraints".table_name,
            "columnType",
            "columnName",
            "foreignTableName",
            "foreignColumnName"`;
        break;
      case 'mysql':
        return new MysqlTableConstraintsGetter(databaseConnection).perform(table);
      case 'mssql':
        query = `
          SELECT
            "constraintName",
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
            SELECT
              "constraintsTable"."constraintName",
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
                    SELECT
                      "constraintColumnUsage".constraint_name AS "constraintName",
                      "constraintColumnUsage".table_name AS "tableName",
                      "tableConstraints".constraint_type AS "columnType",
                      "constraintColumnUsage".column_name AS "columnName",
                      "keyColumnUsage".table_name AS "foreignTableName",
                      "keyColumnUsage".column_name AS "foreignColumnName",
                      "uidx"."uniqueIndexes"
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS "tableConstraints"
                    JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE "constraintColumnUsage"
                      ON "constraintColumnUsage".constraint_name = "tableConstraints".constraint_name
                    LEFT OUTER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS "referentialConstraints"
                      ON "constraintColumnUsage".constraint_name = "referentialConstraints".constraint_name
                    LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE "keyColumnUsage"
                      ON "keyColumnUsage".constraint_name = "referentialConstraints".unique_constraint_name
                    LEFT OUTER JOIN (
                      SELECT
                        "indexesList1"."ind_name",
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
                              SELECT
                                "tables".name AS "t_name",
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
                        SELECT
                          "tables".name AS "t_name",
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
                      GROUP BY
                        "indexesList1"."t_name",
                        "indexesList1"."ind_name"
                    ) "uidx"
                      ON "uidx"."t_name" = "tableConstraints".table_name
                    WHERE "constraintColumnUsage".table_name = '${table}'
                      AND "constraintColumnUsage".table_schema = '${schema !== undefined ? schema : 'dbo'}'
                  ) "constraintsAndIndexes"
                  WHERE "constraintsTable"."tableName" = "constraintsAndIndexes"."tableName"
                    AND "constraintsTable"."columnType" = "constraintsAndIndexes"."columnType"
                    AND "constraintsTable"."columnName" = "constraintsAndIndexes"."columnName"
                  FOR XML PATH(''),
                    TYPE
                  ).value('.', 'varchar(max)'), 1, 2, ''),
                ']'
              ) AS "uniqueIndexes"
            FROM (
              SELECT
                "constraintColumnUsage".constraint_name AS "constraintName",
                "constraintColumnUsage".table_name AS "tableName",
                "tableConstraints".constraint_type AS "columnType",
                "constraintColumnUsage".column_name AS "columnName",
                "keyColumnUsage".table_name AS "foreignTableName",
                "keyColumnUsage".column_name AS "foreignColumnName"
              FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS "tableConstraints"
              JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE "constraintColumnUsage"
                ON "constraintColumnUsage".constraint_name = "tableConstraints".constraint_name
              LEFT OUTER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS "referentialConstraints"
                ON "constraintColumnUsage".constraint_name = "referentialConstraints".constraint_name
              LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE "keyColumnUsage"
                ON "keyColumnUsage".constraint_name = "referentialConstraints".unique_constraint_name
              LEFT OUTER JOIN (
                SELECT
                  "indexesList1"."ind_name",
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
                        SELECT
                          "tables".name AS "t_name",
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
                  SELECT
                    "tables".name AS "t_name",
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
                GROUP BY
                  "indexesList1"."t_name",
                  "indexesList1"."ind_name"
              ) "uidx"
                ON "uidx"."t_name" = "constraintColumnUsage".table_name
              WHERE "constraintColumnUsage".table_name = '${table}'
                AND "constraintColumnUsage".table_schema = '${schema !== undefined ? schema : 'dbo'}'
            ) AS "constraintsTable"
            GROUP BY
              "constraintsTable"."constraintName",
              "constraintsTable"."tableName",
              "constraintsTable"."columnType",
              "constraintsTable"."columnName",
              "constraintsTable"."foreignTableName",
              "constraintsTable"."foreignColumnName"
          ) "alias"
          GROUP BY
            "constraintName",
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

    const constraints = await queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT, replacements });

    // NOTICE: MSSQL doesn't support aggregation to JSON, we need to parse it.
    return constraints.map((constraint) => {
      let { uniqueIndexes } = constraint;
      if (uniqueIndexes !== null && typeof uniqueIndexes === 'string') {
        uniqueIndexes = JSON.parse(uniqueIndexes);
      }

      return { ...constraint, uniqueIndexes };
    });
  };
}

module.exports = TableConstraintsGetter;
