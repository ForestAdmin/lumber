function MysqlTableConstraintsGetter(databaseConnection) {
  const queryInterface = databaseConnection.getQueryInterface();

  this.convertToUniqueIndexArray = (constraints) => {
    // FIXME implement
    return [];
  };

  this.perform = async (table) => {
    const replacements = { table, schemaName: queryInterface.sequelize.config.database };
    const query = `
        SELECT DISTINCT
            tableConstraints.constraint_type AS columnType,
            tableConstraints.constraint_name AS constraintName,
            keyColumnUsage.column_name AS columnName,
            keyColumnUsage.referenced_table_name AS foreignTableName,
            keyColumnUsage.referenced_column_name AS foreignColumnName,
            uniqueIndexes.SEQ_IN_INDEX AS sequenceInIndex
        FROM information_schema.table_constraints AS tableConstraints
        JOIN information_schema.key_column_usage AS keyColumnUsage
          ON tableConstraints.table_name = keyColumnUsage.table_name
          AND tableConstraints.constraint_name = keyColumnUsage.constraint_name
        LEFT JOIN information_schema.STATISTICS AS uniqueIndexes
          ON keyColumnUsage.column_name = uniqueIndexes.column_name
          AND tableConstraints.constraint_name = uniqueIndexes.INDEX_NAME
        WHERE tableConstraints.table_schema = :schemaName
          AND tableConstraints.table_name = :table;
    `;

    const constraints = await queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT, replacements });

    if (constraints && constraints.length) {
      constraints[0].uniqueIndexes = this.convertToUniqueIndexArray(constraints);
    }

    return constraints;
  };
}

module.exports = MysqlTableConstraintsGetter;
