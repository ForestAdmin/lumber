CREATE TABLE [dbo].addresses (
  user_id INT NOT NULL,
  street VARCHAR(30) NOT NULL,
  city VARCHAR(30) NOT NULL,
  state VARCHAR(30) NOT NULL,
  CONSTRAINT addresses_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES [dbo].users(id),
  CONSTRAINT unique_city UNIQUE (city)
);
