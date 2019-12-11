create table customers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) DEFAULT 1 NOT NULL,
  paying BIT(1) DEFAULT NULL,
  created_at DATE NOT NULL,
  updated_at DATE NULL
);
