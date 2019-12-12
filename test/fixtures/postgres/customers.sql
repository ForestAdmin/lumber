create table customers (
  id SERIAL CONSTRAINT customers_pk PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  paying BIT(1) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP
);
