create table customers (
  id serial constraint customers_pk primary key,
  name varchar not null,
  description text,
  is_active boolean default true not null,
  created_at timestamp not null,
  updated_at timestamp
);
