create table customers (
  id BIGSERIAL CONSTRAINT customers_pk PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  paying BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
