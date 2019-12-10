CREATE TABLE [dbo].books (
  id int NOT NULL,
  title varchar(100) NOT NULL,
  author varchar(100) NOT NULL,
  published_date date NOT NULL,
  isbn int,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_isbn_key UNIQUE (isbn ASC)
); 
