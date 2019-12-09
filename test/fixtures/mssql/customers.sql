CREATE TABLE [dbo].customers (
	id int IDENTITY(1,1) NOT NULL,
	name varchar(255) NOT NULL,
  description text NULL,
  is_active TINYINT NOT NULL DEFAULT '1',
  paying bit,
  created_at date NOT NULL,
  updated_at date NULL,
	CONSTRAINT pk_customers PRIMARY KEY (id)
);
