CREATE TABLE only_foreign_keys_and_id (
  id SERIAL PRIMARY KEY,
  sample_id INT,
  car_id INT,
  FOREIGN KEY (sample_id) REFERENCES sample_table(id),
  FOREIGN KEY (car_id) REFERENCES cars(id)
);
