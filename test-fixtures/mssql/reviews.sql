CREATE TABLE [dbo].reviews (
  id INT NOT NULL,
  book_id INT NOT NULL,
  user_id INT NOT NULL,
  review_content VARCHAR(255),
  rating INT,
  published_date DATETIME,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_book_id_fkey FOREIGN KEY (book_id) REFERENCES [dbo].books(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES [dbo].users(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT published_date_rating_key UNIQUE (published_date, rating)
);
