create table addresses (
  id varchar(36) not null,
  customer_id int unsigned null,
  city varchar(127) not null,
  constraint addresses_pk primary key (id),
  constraint addresses_customers_id_fk foreign key (customer_id) references customers (id)
);
