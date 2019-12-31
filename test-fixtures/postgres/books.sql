CREATE TABLE books (
  id SERIAL,
  title VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  published_date TIMESTAMP NOT NULL,
  isbn INT,
  PRIMARY KEY (id),
  UNIQUE (isbn)
);
