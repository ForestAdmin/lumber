CREATE TABLE doubleref (
  car_no INT NOT NULL,
  FOREIGN KEY (car_no)  REFERENCES cars(id),
  PRIMARY KEY (car_no)
);

ALTER TABLE doubleref
  ADD CONSTRAINT same_car_no_fk
  FOREIGN KEY (car_no)
  REFERENCES cars(id);