create table owners (
    id serial primary key,
    name varchar,
    owner_id integer not null
);

create unique index owners_owner_id_uindex on owners (owner_id);

