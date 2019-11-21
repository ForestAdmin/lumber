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
          FULL OUTER JOIN (select
                ix.indexrelid::regclass as index_name,
                t.relname as table_name,
                json_agg(DISTINCT a.attname) as unique_indexes
            from
                pg_class t,
                pg_class i,
                pg_index ix,
                pg_attribute a,
                pg_namespace ns
            where
                t.oid = ix.indrelid
                and i.oid = ix.indexrelid
                and a.attrelid = t.oid
                and a.attnum = ANY(ix.indkey)
                and not ix.indisprimary
                and ix.indisunique
                and t.relkind = 'r'
                and not t.relname like 'pg%'
            group by table_name, index_name) as uidx on uidx.table_name = tc.table_name
            WHERE tc.table_name=:table
          group by tc.constraint_name, tc.table_name, tc.constraint_type, kcu.column_name, foreign_table_name, foreign_column_name`;
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
