DROP TABLE IF EXISTS doubleref;

CREATE TABLE doubleref (
  car_no INT NOT NULL,
  no_car INT NOT NULL,
  FOREIGN KEY (car_no)  REFERENCES cars(id),
  FOREIGN KEY (no_car)  REFERENCES cars(id),
  PRIMARY KEY (car_no)
);

ALTER TABLE doubleref
  ADD CONSTRAINT same_car_no_fk
  FOREIGN KEY (car_no)
  REFERENCES cars(id);
