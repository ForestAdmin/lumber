CREATE TABLE user_books (
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  creation_date TIMESTAMP,
  update_date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON UPDATE CASCADE
);
