CREATE TABLE [dbo].user_books (
      user_id int NOT NULL,
      book_id int NOT NULL,
      checkout_date date,
      return_date date,
      CONSTRAINT user_books_pkey PRIMARY KEY (user_id, book_id),
    CONSTRAINT user_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES [dbo].books(id),
    CONSTRAINT user_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES [dbo].users(id)
    );
