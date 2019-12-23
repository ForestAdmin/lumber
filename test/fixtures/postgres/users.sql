CREATE TABLE users (
  id SERIAL,
  username VARCHAR(25) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);
