CREATE TABLE dbo.addresses (
	id varchar(35) NOT NULL,
	customer_id INT NOT NULL,
	city varchar(127) NOT NULL,
  CONSTRAINT addresses_customers_id_fk FOREIGN KEY (customer_id) REFERENCES dbo.customers(id),
	CONSTRAINT pk_addresses PRIMARY KEY (id)
);