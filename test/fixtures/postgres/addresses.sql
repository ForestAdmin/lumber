CREATE TABLE addresses (
  id VARCHAR(36) NOT NULL CONSTRAINT addresses_pk PRIMARY KEY,
  customer_id INT CONSTRAINT addresses_customers_id_fk REFERENCES customers,
  city VARCHAR(30) NOT NULL UNIQUE
);
