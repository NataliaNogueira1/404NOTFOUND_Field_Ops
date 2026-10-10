CREATE TABLE review_comments (
    id                          BIGSERIAL PRIMARY KEY,
    inspection_id               BIGINT NOT NULL REFERENCES inspections(id),
    inspection_item_snapshot_id BIGINT NOT NULL REFERENCES inspection_item_snapshots(id),
    comment_text                TEXT NOT NULL,
    created_by                  BIGINT NOT NULL REFERENCES users(id),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_comments_inspection_item
    ON review_comments(inspection_id, inspection_item_snapshot_id, created_at);
