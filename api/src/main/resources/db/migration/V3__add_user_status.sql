-- User account lifecycle: only ACTIVE users may authenticate.
-- Existing rows default to ACTIVE; INACTIVE/BLOCKED log in to a generic 401.

ALTER TABLE users
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE users
    ADD CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED'));
