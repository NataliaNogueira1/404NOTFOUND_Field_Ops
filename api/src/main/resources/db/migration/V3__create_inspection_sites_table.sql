-- FieldOps: inspection_sites table
-- Represents physical locations (units, factories, stores) belonging to a client.

CREATE TABLE inspection_sites (
    id              BIGSERIAL       PRIMARY KEY,
    client_id       BIGINT          NOT NULL REFERENCES clients(id),
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    address_line    VARCHAR(300),
    city            VARCHAR(100),
    state           VARCHAR(50),
    postal_code     VARCHAR(20),
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    contact_name    VARCHAR(150),
    contact_phone   VARCHAR(30),
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    version         INTEGER         NOT NULL DEFAULT 0
);

CREATE INDEX idx_inspection_sites_client_id ON inspection_sites (client_id);
CREATE INDEX idx_inspection_sites_status ON inspection_sites (status);
