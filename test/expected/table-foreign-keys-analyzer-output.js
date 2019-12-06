const mysql = [
  {
    tableName: 'addresses',
    columnName: 'id',
    constraintName: 'PRIMARY',
    foreignTableName: null,
    foreignColumnName: null,
  },
  {
    tableName: 'addresses',
    columnName: 'customer_id',
    constraintName: 'addresses_customers_id_fk',
    foreignTableName: 'customers',
    foreignColumnName: 'id',
  },
];

const postgres = [
  {
    constraintName: 'addresses_pk',
    tableName: 'addresses',
    columnType: 'PRIMARY KEY',
    columnName: 'id',
    foreignTableName: 'addresses',
    foreignColumnName: 'id',
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
    constraintName: 'addresses_city_key',
    tableName: 'addresses',
    columnType: 'UNIQUE',
    columnName: 'city',
    foreignTableName: 'addresses',
    foreignColumnName: 'city',
    uniqueIndexes: [['city']],
  },
];

module.exports = { mysql, postgres };
