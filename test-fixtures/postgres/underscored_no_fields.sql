CREATE TABLE underscored_no_fields (
  id INT NOT NULL,
  sample_table_id INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (sample_table_id) REFERENCES sample_table(id) ON UPDATE CASCADE
);
