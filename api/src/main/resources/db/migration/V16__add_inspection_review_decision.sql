-- FieldOps: inspection review decision (PBI-060 approve / PBI-061 reject / #81 #82)
-- Records who reviewed an inspection, when, an optional approval comment and the
-- mandatory rejection reason.

ALTER TABLE inspections
    ADD COLUMN reviewed_at      TIMESTAMPTZ,
    ADD COLUMN reviewed_by      BIGINT REFERENCES users(id),
    ADD COLUMN review_comment   TEXT,
    ADD COLUMN rejection_reason TEXT;
