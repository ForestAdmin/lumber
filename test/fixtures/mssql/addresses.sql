CREATE TABLE [dbo].addresses (
  id INT NOT NULL,
  customer_id INT,
  city VARCHAR(30) NOT NULL UNIQUE,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT fk_customer_id FOREIGN KEY (customer_id) REFERENCES [dbo].customers(id)
);
