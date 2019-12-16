const mssql = [
  {
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'PRIMARY KEY',
    constraintName: 'addresses_pkey',
    foreignTableName: null,
    foreignColumnName: null,
    uniqueIndexes: [['city']],
  },
  {
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'FOREIGN KEY',
    constraintName: 'fk_user_id',
    foreignTableName: 'users',
    foreignColumnName: 'id',
    uniqueIndexes: [['city']],
  },
  {
    tableName: 'addresses',
    columnName: 'city',
    columnType: 'UNIQUE',
    constraintName: 'unique_city',
    foreignColumnName: null,
    foreignTableName: null,
    uniqueIndexes: [['city']],
  },
];

const mysql = [
  {
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'PRIMARY KEY',
    constraintName: 'PRIMARY',
    foreignTableName: null,
    foreignColumnName: null,
    uniqueIndexes: [['city']],
  },
  {
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'FOREIGN KEY',
    constraintName: 'fk_user_id',
    foreignTableName: 'users',
    foreignColumnName: 'id',
    uniqueIndexes: [['city']],
  },
  {
    tableName: 'addresses',
    columnName: 'city',
    columnType: 'UNIQUE',
    constraintName: 'unique_city',
    foreignColumnName: null,
    foreignTableName: null,
    uniqueIndexes: [['city']],
  },
];

const postgres = [
  {
    tableName: 'addresses',
    columnName: 'city',
    columnType: 'UNIQUE',
    constraintName: 'unique_city',
    foreignTableName: 'addresses',
    foreignColumnName: 'city',
    uniqueIndexes: [['city']],
  },
  {
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'PRIMARY KEY',
    constraintName: 'addresses_pkey',
    foreignTableName: 'addresses',
    foreignColumnName: 'user_id',
    uniqueIndexes: [['city']],
  },
  {
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'FOREIGN KEY',
    constraintName: 'fk_user_id',
    foreignTableName: 'users',
    foreignColumnName: 'id',
    uniqueIndexes: [['city']],
  },
];

module.exports = { mssql, mysql, postgres };
