CREATE TABLE reviews (
  id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  book_id int NOT NULL,
  user_id int NOT NULL,
  review_content varchar(255),
  rating int,
  published_date date,
  CONSTRAINT reviews_book_id_fkey FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
);