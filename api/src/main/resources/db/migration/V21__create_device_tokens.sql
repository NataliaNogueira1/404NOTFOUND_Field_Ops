CREATE TABLE device_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    push_token  VARCHAR(255) NOT NULL UNIQUE,
    platform    VARCHAR(10) NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_device_tokens_platform CHECK (platform IN ('ANDROID', 'IOS'))
);

CREATE INDEX idx_device_tokens_user_active ON device_tokens(user_id, active);
