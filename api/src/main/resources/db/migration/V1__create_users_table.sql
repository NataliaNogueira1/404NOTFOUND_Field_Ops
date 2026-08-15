-- FieldOps initial schema
-- Table: users (authenticated users)

CREATE TABLE users (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    password    VARCHAR(100) NOT NULL,
    role        VARCHAR(30)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_users_email UNIQUE (email)
);
