CREATE TABLE rentals (
  car_no INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  PRIMARY KEY (car_no),
  FOREIGN KEY (car_no)  REFERENCES cars (id)
);
