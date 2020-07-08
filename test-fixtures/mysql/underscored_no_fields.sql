CREATE TABLE underscored_no_fields (
  id INT NOT NULL,
  sample_table_id INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT underscored_no_fields_sample_table_id_fkey FOREIGN KEY (sample_table_id) REFERENCES sample_table(id) ON DELETE NO ACTION ON UPDATE CASCADE
);
