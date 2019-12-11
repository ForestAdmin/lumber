CREATE TABLE books (
  id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  title varchar(100) NOT NULL,
  author varchar(100) NOT NULL,
  published_date date NOT NULL,
  isbn int,
  CONSTRAINT books_isbn_key UNIQUE (isbn ASC)
);
