CREATE TABLE [dbo].books (
  id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  author VARCHAR(100) NOT NULL,
  published_date DATETIME NOT NULL,
  isbn INT,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_isbn_key UNIQUE (isbn ASC)
);
