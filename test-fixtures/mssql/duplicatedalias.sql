DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS joinroles;
DROP TABLE IF EXISTS project;

CREATE TABLE project (
  id INT PRIMARY KEY
);

CREATE TABLE joinroles (
  id INT PRIMARY KEY,
  project INT,
  project_id INT,
  CONSTRAINT joinroles_project_fk FOREIGN KEY (project) REFERENCES [dbo].project(id) ON DELETE CASCADE,
  CONSTRAINT joinroles_project_id_fk FOREIGN KEY (project_id) REFERENCES [dbo].project(id)
);

CREATE TABLE roles (
  id INT PRIMARY KEY,
  name VARCHAR(25),
  project INT,
  project_id INT,
  CONSTRAINT roles_project_fk FOREIGN KEY (project) REFERENCES [dbo].project(id) ON DELETE CASCADE,
  CONSTRAINT roles_project_id_fk FOREIGN KEY (project_id) REFERENCES [dbo].project(id)
);
