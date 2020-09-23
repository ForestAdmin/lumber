DROP TABLE IF EXISTS doubleref;

CREATE TABLE doubleref (
  car_no INT NOT NULL,
  no_car INT NOT NULL,
  CONSTRAINT doubleref_car_id_fkey FOREIGN KEY (car_no) REFERENCES [dbo].cars(id),
  CONSTRAINT doubleref_id_car_fkey FOREIGN KEY (no_car) REFERENCES [dbo].cars(id),
  CONSTRAINT doubleref_pkey PRIMARY KEY (car_no)
);

ALTER TABLE doubleref
  ADD CONSTRAINT same_car_no_fk
  FOREIGN KEY (car_no)
  REFERENCES [dbo].cars(id);
