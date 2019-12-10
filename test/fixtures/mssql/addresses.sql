CREATE TABLE [dbo].addresses (
  user_id int NOT NULL,
  street varchar(30) NOT NULL,
  city varchar(30) NOT NULL UNIQUE,
  state varchar(30) NOT NULL,
  CONSTRAINT addresses_pkey PRIMARY KEY (user_id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES [dbo].users(id)
);
