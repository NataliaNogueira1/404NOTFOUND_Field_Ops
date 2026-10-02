CREATE TABLE inspection_evidences (
    id BIGSERIAL PRIMARY KEY,
    inspection_id BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    inspection_item_snapshot_id BIGINT REFERENCES inspection_item_snapshots(id) ON DELETE SET NULL,
    reference TEXT NOT NULL,
    checksum VARCHAR(128) NOT NULL,
    description TEXT,
    captured_at TIMESTAMPTZ NOT NULL,
    uploaded_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspection_evidences_inspection_captured
    ON inspection_evidences(inspection_id, captured_at);
