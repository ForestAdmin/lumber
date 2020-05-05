function MysqlTableConstraintsGetter(databaseConnection) {
  const queryInterface = databaseConnection.getQueryInterface();

  // NOTICE: provide an array of array. Each inner array representing a (possibly composite) unique
  //         index
  this.convertToUniqueIndexArray = (constraints) => {
    const uniqueIndexes = {};
    constraints.filter((constraint) => constraint.columnType === 'UNIQUE')
      .forEach((constraint) => {
        uniqueIndexes[constraint.constraintName] = uniqueIndexes[constraint.constraintName] || [];
        uniqueIndexes[constraint.constraintName].push(constraint.columnName);
      });
    const uniqueIndexArray = Object.values(uniqueIndexes);
    return uniqueIndexArray.length ? uniqueIndexArray : null;
  };

  // NOTICE: This function exists only to create a structure compatible with the needed response.
  this.applyUniqueIndexArray = (constraints) => {
    if (constraints && constraints.length) {
      const uniqueIndexes = this.convertToUniqueIndexArray(constraints);
      // NOTICE: We apply the uniqueIndexes array to every element of the constraints array.
      return constraints.map((constraint) => ({ ...constraint, uniqueIndexes }));
    }
    return constraints;
  };

  this.perform = async (table) => {
    const replacements = { table, schemaName: queryInterface.sequelize.config.database };
    const query = `
        SELECT DISTINCT
            tableConstraints.constraint_type AS columnType,
            tableConstraints.constraint_name AS constraintName,
            tableConstraints.table_name AS tableName,
            keyColumnUsage.column_name AS columnName,
            keyColumnUsage.referenced_table_name AS foreignTableName,
            keyColumnUsage.referenced_column_name AS foreignColumnName,
            uniqueIndexes.SEQ_IN_INDEX AS sequenceInIndex
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tableConstraints
        JOIN INFORMATION_SCHEMA.key_column_usage AS keyColumnUsage
          ON tableConstraints.table_name = keyColumnUsage.table_name
          AND tableConstraints.constraint_name = keyColumnUsage.constraint_name
        LEFT JOIN INFORMATION_SCHEMA.STATISTICS AS uniqueIndexes
          ON keyColumnUsage.column_name = uniqueIndexes.column_name
          AND tableConstraints.constraint_name = uniqueIndexes.INDEX_NAME
        WHERE tableConstraints.table_schema = :schemaName
          AND tableConstraints.table_name = :table
        ORDER BY uniqueIndexes.SEQ_IN_INDEX;
    `;

    const constraints = (await queryInterface.sequelize
      .query(query, { type: queryInterface.sequelize.QueryTypes.SELECT, replacements }))
      // NOTICE: This map remove the `sequenceInIndex`property from the constraints.
      .map(({ sequenceInIndex, ...constraint }) => constraint);

    return this.applyUniqueIndexArray(constraints);
  };
}

module.exports = MysqlTableConstraintsGetter;
