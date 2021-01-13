CREATE TABLE owners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(25),
    owner_id INT NOT NULL,
    CONSTRAINT owner_owner_id_uindex UNIQUE (owner_id)
);
