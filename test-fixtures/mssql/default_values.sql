CREATE TABLE default_values (
    id INT NOT NULL,
    bool_null BIT DEFAULT NULL,
    bool_cst BIT DEFAULT 1,
    int_cst INTEGER DEFAULT 42,
    str_null VARCHAR(25) DEFAULT NULL,
    str_cst VARCHAR(25) DEFAULT 'co''nst''ant',
    str_expr VARCHAR(25) DEFAULT UPPER(CONCAT('Hello', 'World')),
    date_null DATETIME DEFAULT NULL,
    date_cst1 DATETIME DEFAULT '2015-05-11 13:01:01',
    date_cst2 DATETIME DEFAULT '1983-05-27',
    date_expr1 DATETIME DEFAULT getutcdate(),
    date_expr2 DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_def PRIMARY KEY(id)
);