CREATE TABLE reviews (
  id SERIAL,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  review_content VARCHAR(255),
  rating INT,
  published_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT published_date_rating_key UNIQUE (published_date, rating)
);
