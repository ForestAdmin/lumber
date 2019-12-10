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
];

const postgres = [
  {
    constraintName: 'addresses_city_key',
    tableName: 'addresses',
    columnType: 'UNIQUE',
    columnName: 'city',
    foreignTableName: 'addresses',
    foreignColumnName: 'city',
    uniqueIndexes: [['city']],
  },
  {
    constraintName: 'addresses_customers_id_fk',
    tableName: 'addresses',
    columnType: 'FOREIGN KEY',
    columnName: 'customer_id',
    foreignTableName: 'customers',
    foreignColumnName: 'id',
    uniqueIndexes: [['city']],
  },
  {
    constraintName: 'addresses_pkey',
    tableName: 'addresses',
    columnType: 'PRIMARY KEY',
    columnName: 'user_id',
    foreignTableName: 'addresses',
    foreignColumnName: 'user_id',
    uniqueIndexes: [['city']],
  },
  {
    constraintName: 'fk_user_id',
    tableName: 'addresses',
    columnType: 'FOREIGN KEY',
    columnName: 'user_id',
    foreignTableName: 'users',
    foreignColumnName: 'id',
    uniqueIndexes: [['city']],
  },
];

const mssql = [
  {
    constraintName: 'addresses_pkey',
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'PRIMARY KEY',
    foreignTableName: null,
    foreignColumnName: null,
    uniqueIndexes: null,
  },
  {
    constraintName: 'fk_user_id',
    tableName: 'addresses',
    columnName: 'user_id',
    columnType: 'FOREIGN KEY',
    foreignTableName: 'users',
    foreignColumnName: 'id',
    uniqueIndexes: '[["city"]]',
  },
];

module.exports = { mysql, postgres, mssql };
