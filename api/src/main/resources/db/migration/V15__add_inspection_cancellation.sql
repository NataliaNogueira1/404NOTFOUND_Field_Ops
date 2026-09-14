-- FieldOps: inspection cancellation (PBI-029 / #46)
-- Records who cancelled an inspection, when, and the mandatory reason.

ALTER TABLE inspections
    ADD COLUMN canceled_at     TIMESTAMPTZ,
    ADD COLUMN canceled_by     BIGINT REFERENCES users(id),
    ADD COLUMN canceled_reason TEXT;
