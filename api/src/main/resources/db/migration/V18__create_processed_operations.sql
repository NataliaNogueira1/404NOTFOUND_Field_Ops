-- FieldOps: idempotency store for offline sync (PBI-052 / #72)
-- Records every client operation_id already applied, so a resend is a no-op.

CREATE TABLE processed_operations (
    operation_id   UUID          PRIMARY KEY,
    operation_type VARCHAR(40)   NOT NULL,
    entity_id      BIGINT,
    result_summary TEXT,
    processed_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
