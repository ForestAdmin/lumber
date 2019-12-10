
CREATE TABLE [dbo].reviews (
  id int NOT NULL,
  book_id int NOT NULL,
  user_id int NOT NULL,
  review_content varchar(255),
  rating int,
  published_date date,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_book_id_fkey FOREIGN KEY (book_id) REFERENCES [dbo].books(id) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES [dbo].users(id) ON DELETE CASCADE ON UPDATE NO ACTION
);