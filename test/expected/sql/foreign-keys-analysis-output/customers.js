const mysql = [
  {
    tableName: 'customers',
    columnName: 'id',
    constraintName: 'PRIMARY',
    foreignTableName: null,
    foreignColumnName: null,
  },
];

const postgres = [
  {
    constraintName: 'customers_pk',
    tableName: 'customers',
    columnType: 'PRIMARY KEY',
    columnName: 'id',
    foreignTableName: 'customers',
    foreignColumnName: 'id',
    uniqueIndexes: null,
  },
];

module.exports = { mysql, postgres };
