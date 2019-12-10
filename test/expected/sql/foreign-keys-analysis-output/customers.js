const mysql = [
  {
    tableName: 'customers',
    columnName: 'id',
    columnType: 'PRIMARY KEY',
    constraintName: 'PRIMARY',
    foreignTableName: null,
    foreignColumnName: null,
    uniqueIndexes: null,
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

const mssql = [
  {
    constraintName: 'pk_customers',
    tableName: 'customers',
    columnName: 'id',
    columnType: 'PRIMARY KEY',
    foreignTableName: null,
    foreignColumnName: null,
    uniqueIndexes: null,
  },
];

module.exports = { mysql, postgres, mssql };
