CREATE TABLE [dbo].underscored_no_fields (
  id INT NOT NULL,
  sample_table_id INT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT underscored_no_fields_sample_table_id_fkey FOREIGN KEY (sample_table_id) REFERENCES [dbo].sample_table(id),
);
