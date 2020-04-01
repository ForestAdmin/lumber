CREATE TABLE rentals (
  car_no INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  CONSTRAINT rentals_pkey PRIMARY KEY (car_no),
  CONSTRAINT rentals_car_id_fkey FOREIGN KEY (car_no) REFERENCES [dbo].cars(id)
);
