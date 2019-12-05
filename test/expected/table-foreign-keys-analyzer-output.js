const mysql = [
  {
    table_name: 'addresses',
    column_name: 'id',
    constraint_name: 'PRIMARY',
    foreign_table_name: null,
    foreign_column_name: null,
  },
  {
    table_name: 'addresses',
    column_name: 'customer_id',
    constraint_name: 'addresses_customers_id_fk',
    foreign_table_name: 'customers',
    foreign_column_name: 'id',
  },
];

const postgres = [
  {
    constraint_name: 'addresses_pk',
    table_name: 'addresses',
    column_type: 'PRIMARY KEY',
    column_name: 'id',
    foreign_table_name: 'addresses',
    foreign_column_name: 'id',
    unique_indexes: [['city']],
  },
  {
    constraint_name: 'addresses_customers_id_fk',
    table_name: 'addresses',
    column_type: 'FOREIGN KEY',
    column_name: 'customer_id',
    foreign_table_name: 'customers',
    foreign_column_name: 'id',
    unique_indexes: [['city']],
  },
  {
    constraint_name: 'addresses_city_key',
    table_name: 'addresses',
    column_type: 'UNIQUE',
    column_name: 'city',
    foreign_table_name: 'addresses',
    foreign_column_name: 'city',
    unique_indexes: [['city']],
  },
];

module.exports = { mysql, postgres };
