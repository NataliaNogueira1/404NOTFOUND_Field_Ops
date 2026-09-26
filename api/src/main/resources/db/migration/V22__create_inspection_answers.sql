CREATE TABLE inspection_answers (
    id                          BIGSERIAL PRIMARY KEY,
    inspection_id               BIGINT NOT NULL REFERENCES inspections(id),
    inspection_item_snapshot_id BIGINT NOT NULL REFERENCES inspection_item_snapshots(id),
    answer_value                TEXT NOT NULL,
    observation                 TEXT,
    answered_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    answered_by                 BIGINT NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_inspection_answers_history
    ON inspection_answers(inspection_id, inspection_item_snapshot_id, answered_at);
