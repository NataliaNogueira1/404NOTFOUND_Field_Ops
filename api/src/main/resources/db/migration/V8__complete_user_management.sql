-- Fields required by the administrator user-management flow.
ALTER TABLE users
    RENAME COLUMN password TO password_hash;

ALTER TABLE users
    ALTER COLUMN name TYPE VARCHAR(100),
    ADD COLUMN phone VARCHAR(30),
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
