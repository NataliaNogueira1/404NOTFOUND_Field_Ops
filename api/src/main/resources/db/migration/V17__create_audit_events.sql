-- FieldOps: audit events (PBI-063 / #83)
-- Append-only trail of state changes. Rows are never updated or deleted.

CREATE TABLE audit_events (
    id           BIGSERIAL     PRIMARY KEY,
    actor_id     BIGINT        REFERENCES users(id),
    action       VARCHAR(40)   NOT NULL,
    entity_type  VARCHAR(40)   NOT NULL,
    entity_id    BIGINT        NOT NULL,
    detail       TEXT,
    occurred_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_entity ON audit_events (entity_type, entity_id, occurred_at);
