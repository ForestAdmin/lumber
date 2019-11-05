create table addresses (
  id uuid not null constraint addresses_pk primary key,
  customer_id int constraint addresses_customers_id_fk references customers,
  city varchar not null
);