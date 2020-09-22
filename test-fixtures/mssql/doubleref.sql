DROP TABLE IF EXISTS doubleref;

CREATE TABLE doubleref (
  car_no INT NOT NULL,
  CONSTRAINT doubleref_pkey PRIMARY KEY (car_no),
  CONSTRAINT doubleref_car_id_fkey FOREIGN KEY (car_no) REFERENCES [dbo].cars(id)
);

ALTER TABLE doubleref
  ADD CONSTRAINT same_car_no_fk
  FOREIGN KEY (car_no)
  REFERENCES [dbo].cars(id);
