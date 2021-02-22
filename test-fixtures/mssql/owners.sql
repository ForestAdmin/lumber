CREATE TABLE [dbo].owners (
    id INT NOT NULL,
    name VARCHAR(25),
    owner_id INT NOT NULL,
    CONSTRAINT owners_pkey PRIMARY KEY (id),
    CONSTRAINT owner_owner_id_uindex UNIQUE (owner_id)
);
