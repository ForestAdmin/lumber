CREATE TABLE users (
  id int auto_increment PRIMARY KEY,
  username varchar(25) NOT NULL,
  enabled bit(1) DEFAULT 1,
  last_login date NOT NULL
);
