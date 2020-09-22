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
  FOREIGN KEY (project) REFERENCES project(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE TABLE roles (
  id INT PRIMARY KEY,
  name VARCHAR,
  project INT,
  project_id INT,
  FOREIGN KEY (project) REFERENCES project(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);
