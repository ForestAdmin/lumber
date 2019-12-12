CREATE TABLE addresses (
  user_id INT NOT NULL PRIMARY KEY,
  street VARCHAR(30) NOT NULL,
  city VARCHAR(30) NOT NULL,
  state VARCHAR(30) NOT NULL,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT unique_city UNIQUE (city)
);
