CREATE TABLE only_foreign_keys_and_id (
    id INT PRIMARY KEY,
    customer_id BIGINT,
    car_id INT,
    CONSTRAINT fk_customer_id FOREIGN KEY (customer_id)  REFERENCES customers (id),
    CONSTRAINT fk_car_id FOREIGN KEY (car_id)  REFERENCES cars (id)
);

