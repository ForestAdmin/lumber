CREATE TABLE default_values (
    id SERIAL,
    bool_null BIT(1) DEFAULT NULL,
    bool_cst BIT(1) DEFAULT TRUE,
    int_cst INTEGER DEFAULT 42,
    str_null VARCHAR(25) DEFAULT NULL,
    str_cst VARCHAR(25) DEFAULT 'co''nst''ant',
    str_expr VARCHAR(25) DEFAULT (UPPER(CONCAT('Hello', 'World'))),
    date_null TIMESTAMP DEFAULT NULL,
    date_cst1 TIMESTAMP DEFAULT '2015-05-11 13:01:01',
    date_cst2 DATE DEFAULT '1983-05-27',
    date_expr1 TIMESTAMP DEFAULT NOW(),
    date_expr2 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enum_cst1 ENUM('a', 'b', 'c') DEFAULT NULL,
    enum_cst2 ENUM('a', 'b', 'c') DEFAULT 'a',
    json_cst JSON DEFAULT ('{"a":1,"b":2}'),
    PRIMARY KEY(id)
);