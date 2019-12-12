CREATE TABLE addresses (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  customer_id INT UNSIGNED NULL,
  city VARCHAR(30) NOT NULL UNIQUE,
  CONSTRAINT fk_customer_id FOREIGN KEY (customer_id) REFERENCES customers (id)
);
