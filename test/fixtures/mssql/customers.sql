CREATE TABLE dbo.customers (
	id int IDENTITY(1,1) NOT NULL,
	name varchar(255) NOT NULL,
  description text NULL,
  is_active tinyint DEFAULT 1 NOT NULL,
  paying bit DEFAULT NULL,
  created_at date NOT NULL,
  updated_at date NULL,
	CONSTRAINT pk_customers PRIMARY KEY (id)
);
