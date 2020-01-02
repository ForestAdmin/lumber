CREATE TABLE user_books (
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  creation_date DATE,
  update_date DATE,
  CONSTRAINT user_books_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT user_books_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION ON UPDATE CASCADE
);
