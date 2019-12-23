CREATE TABLE [dbo].customers (
  id INT IDENTITY(1,1) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BIT DEFAULT 1 NOT NULL,
  paying BIT DEFAULT 0 NOT NULL,
  created_at DATE NOT NULL,
  updated_at DATE NOT NULL,
  CONSTRAINT pk_customers PRIMARY KEY (id)
);
