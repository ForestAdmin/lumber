CREATE TABLE [dbo].users (
  id INT NOT NULL,
  username VARCHAR(25) NOT NULL,
  enabled BIT DEFAULT 1,
  last_login DATETIME NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
