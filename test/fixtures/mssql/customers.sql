CREATE TABLE [dbo].customers (
  id INT IDENTITY(1,1) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description text NULL,
  is_active TINYINT NOT NULL DEFAULT '1',
  paying BIT,
  created_at DATE NOT NULL,
  updated_at DATE NULL,
  CONSTRAINT pk_customers PRIMARY KEY (id)
);
