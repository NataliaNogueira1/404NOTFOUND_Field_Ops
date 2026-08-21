-- FieldOps: equipment table
-- Represents physical assets (machines, devices) that can be inspected at a site.

CREATE TABLE equipment (
    id              BIGSERIAL       PRIMARY KEY,
    site_id         BIGINT          NOT NULL REFERENCES inspection_sites(id),
    name            VARCHAR(200)    NOT NULL,
    asset_number    VARCHAR(50),
    serial_number   VARCHAR(100),
    manufacturer    VARCHAR(150),
    model           VARCHAR(150),
    description     TEXT,
    qr_code         VARCHAR(200),
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    installed_at    DATE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    version         INTEGER         NOT NULL DEFAULT 0,
    CONSTRAINT uk_equipment_qr_code UNIQUE (qr_code)
);

CREATE INDEX idx_equipment_site_id ON equipment (site_id);
CREATE INDEX idx_equipment_status ON equipment (status);
CREATE INDEX idx_equipment_qr_code ON equipment (qr_code);
