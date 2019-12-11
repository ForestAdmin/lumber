CREATE TABLE books (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  published_date DATE NOT NULL,
  isbn INT,
  CONSTRAINT books_isbn_key UNIQUE (isbn ASC)
);
