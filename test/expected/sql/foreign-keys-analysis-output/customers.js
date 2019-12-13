const mssql = [
  {
    tableName: 'customers',
    columnName: 'id',
    columnType: 'PRIMARY KEY',
    constraintName: 'pk_customers',
    foreignTableName: null,
    foreignColumnName: null,
    uniqueIndexes: null,
  },
];

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
    tableName: 'customers',
    columnName: 'id',
    columnType: 'PRIMARY KEY',
    constraintName: 'customers_pk',
    foreignTableName: 'customers',
    foreignColumnName: 'id',
    uniqueIndexes: null,
  },
];

module.exports = { mssql, mysql, postgres };
