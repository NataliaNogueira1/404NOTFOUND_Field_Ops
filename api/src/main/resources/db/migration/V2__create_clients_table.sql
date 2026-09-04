-- FieldOps: clients table
-- Represents companies/organizations that receive inspection services.

CREATE TABLE clients (
    id          BIGSERIAL       PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    legal_name  VARCHAR(200),
    document    VARCHAR(30),
    email       VARCHAR(150),
    phone       VARCHAR(30),
    status      VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
    version     INTEGER         NOT NULL DEFAULT 0,
    CONSTRAINT uk_clients_document UNIQUE (document)
);

CREATE INDEX idx_clients_status ON clients (status);
CREATE INDEX idx_clients_name ON clients (name);
