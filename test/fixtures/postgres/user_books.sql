CREATE TABLE user_books (
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  checkout_date TIMESTAMP,
  return_date TIMESTAMP,
  PRIMARY KEY (user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON UPDATE CASCADE
);
