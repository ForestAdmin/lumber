create table customers (
  id serial constraint customers_pk primary key,
  name varchar not null,
  description text,
  is_active boolean default true not null,
  paying bit(1) default B'0',
  created_at timestamp not null,
  updated_at timestamp
);
