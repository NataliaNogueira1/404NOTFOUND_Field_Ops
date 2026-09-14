ALTER TABLE template_items
    RENAME COLUMN require_observation_on_failure TO observation_required_on_failure;

ALTER TABLE template_items
    RENAME COLUMN require_evidence_on_failure TO evidence_required_on_failure;

CREATE TABLE inspection_item_snapshots (
    id               BIGSERIAL PRIMARY KEY,
    inspection_id    BIGINT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    template_item_id BIGINT NOT NULL,
    rules_json       TEXT NOT NULL,
    CONSTRAINT uk_inspection_item_snapshot UNIQUE (inspection_id, template_item_id)
);

CREATE INDEX idx_item_snapshots_inspection ON inspection_item_snapshots(inspection_id);
