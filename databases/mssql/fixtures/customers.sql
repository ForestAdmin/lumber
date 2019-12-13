CREATE TABLE [dbo].customers (
    id int IDENTITY(1,1) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    paying BIT DEFAULT 0 NOT NULL,
    created_at DATE NOT NULL,
    updated_at DATE NOT NULL,
    CONSTRAINT pk_customers PRIMARY KEY (id)
);
