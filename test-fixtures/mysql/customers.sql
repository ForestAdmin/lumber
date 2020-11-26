create table customers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BIT(1) DEFAULT 1 NOT NULL,
  paying BIT(1) DEFAULT 0 NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
