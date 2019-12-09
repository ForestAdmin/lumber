CREATE TABLE [dbo].addresses (
	id int NOT NULL,
	customer_id int NOT NULL,
	city varchar(30) NOT NULL,
	CONSTRAINT addresses_pkey PRIMARY KEY (id),
	CONSTRAINT city_unique UNIQUE(city),
	CONSTRAINT addresses_customers_id_fk FOREIGN KEY (customer_id) REFERENCES [dbo].customers(id)
);