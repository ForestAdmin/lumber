CREATE TABLE only_foreign_keys_and_id (
    id INT PRIMARY KEY,
    sample_id INT,
    car_id INT,
    CONSTRAINT fk_sample_id FOREIGN KEY (sample_id)  REFERENCES sample_table (id),
    CONSTRAINT fk_car_id FOREIGN KEY (car_id)  REFERENCES cars (id)
);

