CREATE TABLE [dbo].users (
  id int NOT NULL,
  username varchar(25) NOT NULL,
  enabled bit DEFAULT 1,
  last_login date NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);