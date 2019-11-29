CREATE TABLE [dbo].users_books (
  user_id int NOT NULL,
  book_id int NOT NULL,
  checkout_date timestamp,
  return_date timestamp,
  CONSTRAINT users_books_pkey PRIMARY KEY (user_id, book_id),
  CONSTRAINT users_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES [dbo].books(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT users_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES [dbo].users(id) ON DELETE NO ACTION ON UPDATE CASCADE
);