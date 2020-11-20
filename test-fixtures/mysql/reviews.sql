CREATE TABLE reviews (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  review_content VARCHAR(255),
  rating INT,
  published_date DATETIME,
  CONSTRAINT reviews_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT published_date_rating_key UNIQUE (published_date, rating)
);
