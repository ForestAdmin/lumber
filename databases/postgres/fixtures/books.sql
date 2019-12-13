CREATE TABLE books (
  id serial,
  title VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  published_date timestamp NOT NULL,
  isbn int,
  PRIMARY KEY (id),
  UNIQUE (isbn)
);