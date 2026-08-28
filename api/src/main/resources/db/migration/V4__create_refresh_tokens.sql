-- Server-side refresh tokens: opaque UUIDs issued at login, validated on renewal,
-- deleted on logout. Enables session revocation without JWT denylists.

CREATE TABLE refresh_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    token       VARCHAR(64)  NOT NULL,
    user_id     BIGINT       NOT NULL REFERENCES users (id),
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_refresh_tokens_token UNIQUE (token)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
