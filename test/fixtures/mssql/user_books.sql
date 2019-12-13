CREATE TABLE [dbo].user_books (
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  checkout_date DATE,
  return_date DATE,
  CONSTRAINT user_books_pkey PRIMARY KEY (user_id, book_id),
  CONSTRAINT user_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES [dbo].books(id),
  CONSTRAINT user_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES [dbo].users(id)
);
