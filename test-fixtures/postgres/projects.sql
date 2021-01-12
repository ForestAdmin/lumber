create table projects (
    id serial primary key,
    name varchar,
    owner_id integer not null constraint owner_project_pk references owners (owner_id)
);


