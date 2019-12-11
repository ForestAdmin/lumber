CREATE TABLE addresses (
  user_id INT NOT NULL,
  customer_id INT CONSTRAINT addresses_customers_id_fk REFERENCES customers,
  street VARCHAR(30) NOT NULL,
  city VARCHAR(30) NOT NULL UNIQUE,
  state VARCHAR(30) NOT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id)
);
