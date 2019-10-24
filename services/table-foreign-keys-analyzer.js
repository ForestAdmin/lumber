function TableForeignKeysAnalyzer(databaseConnection, config) {
  const queryInterface = databaseConnection.getQueryInterface();

  this.perform = async (table) => {
    let query = null;
    const replacements = { table };

    switch (queryInterface.sequelize.options.dialect) {
      case 'postgres':
        query = `
          SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE constraint_type = 'FOREIGN KEY'
            AND tc.table_name=:table;`;
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
          WHERE fk.parent_object_id = (SELECT object_id FROM sys.tables WHERE name = :table)`;
        break;
      case 'sqlite':
        query = 'PRAGMA foreign_key_list(:table);';
        break;
      default:
        break;
    }

    console.log(replacements);
    return queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT, replacements });
  };
}

module.exports = TableForeignKeysAnalyzer;
