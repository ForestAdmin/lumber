DROP TYPE IF EXISTS default_values_enum;

CREATE TYPE default_values_enum AS ENUM ('a', 'b', 'c');

CREATE TABLE default_values (
    id SERIAL,
    bool_null BOOLEAN DEFAULT NULL,
    bool_cst BOOLEAN DEFAULT TRUE,
    int_cst INTEGER DEFAULT 42,
    str_null VARCHAR(25) DEFAULT NULL,
    str_cst VARCHAR(25) DEFAULT 'co''nst''ant',
    str_expr VARCHAR(25) DEFAULT UPPER('Hello' || 'World'),
    date_null TIMESTAMP DEFAULT NULL,
    date_cst1 TIMESTAMP DEFAULT '2010-01-01T00:00:00Z',
    date_cst2 TIMESTAMP DEFAULT '1983-05-27',
    date_expr1 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_expr2 TIMESTAMP DEFAULT now(),
    date_expr3 TIMESTAMP DEFAULT timezone('utc', now()),
    enum_cst1 default_values_enum DEFAULT NULL,
    enum_cst2 default_values_enum DEFAULT 'a',
    array_cst1 INTEGER [] DEFAULT '{25000,25000,27000,27000}',
    array_cst2 INTEGER [] DEFAULT ARRAY [25000,25000,27000,27000],
    json_cst JSON DEFAULT '{"a":1,"b":2}' :: json,
    jsonb_cst JSONB DEFAULT '{"a":1,"b":2}' :: jsonb,
    PRIMARY KEY(id)
);