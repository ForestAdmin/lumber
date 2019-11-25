function TableForeignKeysAnalyzer(databaseConnection, schema) {
  const queryInterface = databaseConnection.getQueryInterface();

  this.perform = async (table) => {
    let query = null;
    const replacements = { table };

    switch (queryInterface.sequelize.options.dialect) {
      case 'postgres':
        query = `
        SELECT tc.constraint_name,
            tc.table_name,
            tc.constraint_type AS column_type,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            json_agg(uidx.unique_indexes) filter (where uidx.unique_indexes is not null) AS unique_indexes
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          FULL OUTER JOIN (
            SELECT ix.indexrelid::regclass AS index_name,
                t.relname AS table_name,
                json_agg(DISTINCT a.attname) AS unique_indexes
            FROM
                pg_class t,
                pg_class i,
                pg_index ix,
                pg_attribute a,
                pg_namespace ns
            WHERE
                t.oid = ix.indrelid
                AND i.oid = ix.indexrelid
                AND a.attrelid = t.oid
                AND a.attnum = ANY(ix.indkey)
                AND not ix.indisprimary
                AND ix.indisunique
                AND t.relkind = 'r'
                AND not t.relname like 'pg%'
            GROUP BY table_name, index_name) AS uidx on uidx.table_name = tc.table_name
          WHERE tc.table_name=:table
          GROUP BY tc.constraint_name, tc.table_name, tc.constraint_type, kcu.column_name, foreign_table_name, foreign_column_name`;
        break;
      case 'mysql':
        query = `
        SELECT constraint_name,
               table_name,
               column_name,
               column_type,
               foreign_table_name,
               foreign_column_name,
               CASE
                 WHEN cast('[null]' as json) = unique_indexes THEN NULL
                 ELSE unique_indexes
               END as unique_indexes 
        FROM (
          SELECT tc.CONSTRAINT_NAME AS constraint_name,
                 tc.TABLE_NAME AS table_name,
                 kcu.COLUMN_NAME AS column_name,
                 tc.CONSTRAINT_TYPE AS column_type,
                 kcu.REFERENCED_TABLE_NAME AS foreign_table_name,
                 kcu.REFERENCED_COLUMN_NAME AS foreign_column_name,
                 JSON_ARRAYAGG(uidx.unique_indexes) AS unique_indexes
          FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS as tc
          JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
            ON tc.TABLE_NAME = kcu.TABLE_NAME 
            AND tc.constraint_name = kcu.constraint_name
          LEFT OUTER JOIN (
            SELECT distinct uidx.INDEX_NAME, uidx.table_name, JSON_ARRAYAGG(uidx.COLUMN_NAME) as unique_indexes 
            FROM information_schema.STATISTICS AS uidx
            WHERE INDEX_SCHEMA = :databaseName 
              AND uidx.NON_UNIQUE = 0
              AND INDEX_NAME != 'PRIMARY' 
            GROUP BY table_name, index_name) AS uidx
            ON uidx.table_name = tc.table_name
           WHERE tc.TABLE_SCHEMA = :databaseName 
              AND tc.TABLE_NAME = :table 
              AND tc.CONSTRAINT_TYPE != 'UNIQUE'
           GROUP BY constraint_name, table_name, column_type, column_name, foreign_table_name, foreign_column_name
        ) AS alias 
        GROUP BY constraint_name, table_name, column_type, column_name, foreign_table_name, foreign_column_name, unique_indexes`;
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
      case 'sqlite':
        query = 'PRAGMA foreign_key_list(:table);';
        break;
      default:
        break;
    }

    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT, replacements });
  };
}

module.exports = TableForeignKeysAnalyzer;
