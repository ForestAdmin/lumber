CREATE TABLE [dbo].projects (
    id INT NOT NULL,
    name VARCHAR(25),
    owner_id INT NOT NULL,
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT fk_owner_id FOREIGN KEY (owner_id) REFERENCES [dbo].owners (owner_id)
);
