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
            GROUP BY table_name, index_name) AS uidx
            ON uidx.table_name = tc.table_name
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
            SELECT distinct uidx.INDEX_NAME,
                   uidx.table_name, 
                   JSON_ARRAYAGG(uidx.COLUMN_NAME) as unique_indexes 
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
   SELECT constraint_name,
        table_name,
        column_name,
        column_type,
        foreign_table_name,
        foreign_column_name,
        CASE
          WHEN '[]' = unique_indexes THEN NULL
          ELSE unique_indexes
        END as unique_indexes 
   FROM (
     SELECT c.constraint_name,
          c.table_name,
          c.column_type,
          c.column_name,
          c.foreign_table_name,
          c.foreign_column_name,
         CONCAT('[',
           STUFF(
             (
               SELECT ', ' + d.unique_indexes
               FROM (
                 SELECT ccu.constraint_name,
                      ccu.table_name AS table_name,
                      tc.constraint_type AS column_type,
                      ccu.column_name AS column_name,
                      kcu.table_name AS foreign_table_name,
                      kcu.column_name AS foreign_column_name,
                      uidx.unique_indexes
                 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                 JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
                   ON ccu.constraint_name = tc.constraint_name
                 LEFT OUTER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                   ON ccu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
                 LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
                   ON kcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME
                 LEFT OUTER JOIN (
                   SELECT a.ind_name, a.t_name,
                     CONCAT('[',
                       STUFF(
                         (
                           SELECT ', ' + CONCAT('"', b.unique_indexes, '"')
                           FROM (
                             SELECT t.name as t_name, ind.name as ind_name, col.name as unique_indexes
                             FROM sys.indexes ind 
                             JOIN sys.index_columns ic 
                               ON  ind.object_id = ic.object_id 
                               AND ind.index_id = ic.index_id 
                             JOIN sys.tables t 
                               ON ind.object_id = t.object_id 
                             JOIN sys.columns col
                               ON ic.object_id = col.object_id 
                               AND ic.column_id = col.column_id 
                             WHERE ind.is_primary_key = 0
                               AND (ind.is_unique = 1 OR ind.is_unique_constraint = 1)
                           ) b
                           WHERE b.t_name = a.t_name AND b.ind_name = a.ind_name
                           FOR XML PATH(''), TYPE
                         ).value('.','varchar(max)'), 1, 2, ''
                       ), ']'
                     ) AS unique_indexes
                   FROM (
                     SELECT t.name as t_name, ind.name as ind_name, col.name
                     FROM sys.indexes ind 
                     JOIN sys.index_columns ic 
                       ON  ind.object_id = ic.object_id 
                       AND ind.index_id = ic.index_id 
                     JOIN sys.tables t 
                       ON ind.object_id = t.object_id 
                     JOIN sys.columns col
                       ON ic.object_id = col.object_id 
                       AND ic.column_id = col.column_id 
                     WHERE ind.is_primary_key = 0
                       AND (ind.is_unique = 1 OR ind.is_unique_constraint = 1)
                   ) a
                   GROUP BY a.t_name, a.ind_name
                 ) uidx
                   ON uidx.t_name = tc.table_name
                 WHERE ccu.table_name = :table AND ccu.table_schema = '${schema}'
               ) d
               WHERE c.constraint_name = d.constraint_name
                 AND c.table_name = d.table_name
                 AND c.column_type = d.column_type
                 AND c.column_name = d.column_name
                 AND c.foreign_table_name = d.foreign_table_name
                 AND c.foreign_column_name = d.foreign_column_name
               FOR XML PATH(''), TYPE
             ).value('.','varchar(max)'), 1, 2, ''
           ), ']'
         ) AS unique_indexes
     FROM (
       SELECT ccu.constraint_name,
            ccu.table_name AS table_name,
            tc.constraint_type AS column_type,
            ccu.column_name AS column_name,
            kcu.table_name AS foreign_table_name,
            kcu.column_name AS foreign_column_name
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
       JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
         ON ccu.constraint_name = tc.constraint_name
       LEFT OUTER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
         ON ccu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME 
       LEFT OUTER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
         ON kcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME
       LEFT OUTER JOIN (
         SELECT a.ind_name, a.t_name,
           CONCAT('[',
             STUFF(
               (
                 SELECT ', ' + CONCAT('"', b.unique_indexes, '"')
                 FROM (
                   SELECT t.name as t_name, ind.name as ind_name, col.name as unique_indexes
                   FROM sys.indexes ind 
                   JOIN sys.index_columns ic 
                     ON  ind.object_id = ic.object_id 
                     AND ind.index_id = ic.index_id 
                   JOIN sys.tables t 
                     ON ind.object_id = t.object_id 
                   JOIN sys.columns col
                     ON ic.object_id = col.object_id 
                     AND ic.column_id = col.column_id 
                   WHERE ind.is_primary_key = 0
                     AND (ind.is_unique = 1 OR ind.is_unique_constraint = 1)
                 ) b
                 WHERE b.t_name = a.t_name AND b.ind_name = a.ind_name
                 FOR XML PATH(''), TYPE
               ).value('.','varchar(max)'), 1, 2, ''
             ), ']'
           ) AS unique_indexes
         FROM (
           SELECT t.name as t_name, ind.name as ind_name, col.name
           FROM sys.indexes ind 
           JOIN sys.index_columns ic 
             ON  ind.object_id = ic.object_id 
             AND ind.index_id = ic.index_id 
           JOIN sys.tables t 
             ON ind.object_id = t.object_id 
           JOIN sys.columns col
             ON ic.object_id = col.object_id 
             AND ic.column_id = col.column_id 
           WHERE ind.is_primary_key = 0
             AND (ind.is_unique = 1 OR ind.is_unique_constraint = 1)
         ) a
         GROUP BY a.t_name, a.ind_name
       ) uidx
         ON uidx.t_name = ccu.table_name
         WHERE ccu.table_name = :table AND ccu.table_schema = '${schema}'
     ) as c
     WHERE column_type != 'UNIQUE'
     GROUP BY c.constraint_name, c.table_name, c.column_type, c.column_name, c.foreign_table_name, c.foreign_column_name
     ) alias 
   GROUP BY constraint_name, table_name, column_type, column_name, foreign_table_name, foreign_column_name, unique_indexes
        `;
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
