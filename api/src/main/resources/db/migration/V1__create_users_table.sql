-- FieldOps initial schema
-- Table: users (authenticated users)

CREATE TABLE users (
    id          BIGSERIAL    PRIMARY KEY,
    nome        VARCHAR(150) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    senha       VARCHAR(100) NOT NULL,
    perfil      VARCHAR(30)  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_users_email UNIQUE (email)
);
