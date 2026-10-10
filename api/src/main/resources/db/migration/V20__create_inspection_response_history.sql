-- FieldOps: detailed answer history (PBI-088 / #150)
--
-- Append-only trail of checklist answers. Complements the state-change audit
-- trail from PBI-063 (audit_events): that table records inspection status
-- transitions, while this one records the content of every answer version
-- (item, section, value, observation, author, timestamp).
--
-- Rows are never updated or deleted. Each time an item is answered (or
-- re-answered) a new row is appended, so the full history of an item is
-- preserved and can be replayed chronologically.

CREATE TABLE inspection_response_history (
    id                BIGSERIAL     PRIMARY KEY,
    inspection_id     BIGINT        NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    -- Reference to the frozen checklist item (inspection_item_snapshots.source_template_item_id).
    item_id           BIGINT        NOT NULL,
    section_title     VARCHAR(200)  NOT NULL,
    section_order     INTEGER       NOT NULL,
    item_title        VARCHAR(500)  NOT NULL,
    item_order        INTEGER       NOT NULL,
    -- Raw answer value, stored as text preserving the original representation
    -- (e.g. "CONFORMING", "true", "42.5", free text). NULL when the item was
    -- cleared. The response_type lets consumers interpret the string.
    response_type     VARCHAR(30)   NOT NULL,
    answer_value      TEXT,
    observation       TEXT,
    answered_by       BIGINT        REFERENCES users(id),
    answered_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Deterministic ordering (section -> item -> chronological) and per-inspection lookups.
CREATE INDEX idx_response_history_order
    ON inspection_response_history (inspection_id, section_order, item_order, answered_at, id);
