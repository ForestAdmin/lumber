create table customers (
  id int unsigned auto_increment primary key,
  name varchar(255) not null,
  description text null,
  is_active tinyint(1) default 1 not null,
  paying bit(1) default null,
  created_at date not null,
  updated_at date null
);
