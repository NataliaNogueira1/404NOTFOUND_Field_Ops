CREATE TABLE non_conformities (
    id                          BIGSERIAL PRIMARY KEY,
    inspection_id               BIGINT NOT NULL REFERENCES inspections(id),
    inspection_item_snapshot_id BIGINT REFERENCES inspection_item_snapshots(id),
    title                       VARCHAR(200) NOT NULL,
    description                 TEXT NOT NULL,
    severity                    VARCHAR(10) NOT NULL,
    status                      VARCHAR(10) NOT NULL DEFAULT 'OPEN',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at                   TIMESTAMPTZ,
    CONSTRAINT chk_non_conformities_severity
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_non_conformities_status
        CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE INDEX idx_non_conformities_inspection ON non_conformities(inspection_id);
CREATE INDEX idx_non_conformities_status ON non_conformities(status);
