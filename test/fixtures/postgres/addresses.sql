CREATE TABLE addresses (
  user_id INT NOT NULL,
  street VARCHAR(30) NOT NULL,
  city VARCHAR(30) NOT NULL CONSTRAINT unique_city UNIQUE,
  state VARCHAR(30) NOT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);
