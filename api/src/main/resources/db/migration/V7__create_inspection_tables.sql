-- Inspection templates (model definitions)
CREATE TABLE inspection_templates (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    version     INTEGER NOT NULL DEFAULT 1,
    published   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sections within a template
CREATE TABLE template_sections (
    id          BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL REFERENCES inspection_templates(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_template_sections_template ON template_sections(template_id);

-- Items (questions) within a section
CREATE TABLE template_items (
    id                              BIGSERIAL PRIMARY KEY,
    section_id                      BIGINT NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
    question                        VARCHAR(500) NOT NULL,
    description                     VARCHAR(1000),
    response_type                   VARCHAR(30) NOT NULL,
    required                        BOOLEAN NOT NULL DEFAULT TRUE,
    require_observation_on_failure  BOOLEAN NOT NULL DEFAULT FALSE,
    require_evidence_on_failure     BOOLEAN NOT NULL DEFAULT FALSE,
    options                         TEXT,
    sort_order                      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_template_items_section ON template_items(section_id);

-- Inspections assigned to technicians
CREATE TABLE inspections (
    id                       BIGSERIAL PRIMARY KEY,
    title                    VARCHAR(300) NOT NULL,
    template_id              BIGINT NOT NULL REFERENCES inspection_templates(id),
    client_name              VARCHAR(200) NOT NULL,
    site_name                VARCHAR(200) NOT NULL,
    equipment_name           VARCHAR(200) NOT NULL,
    technician_id            BIGINT NOT NULL REFERENCES users(id),
    supervisor_id            BIGINT NOT NULL REFERENCES users(id),
    status                   VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED',
    priority                 VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    due_date                 DATE NOT NULL,
    due_time                 TIME,
    supervisor_instructions  TEXT,
    progress                 INTEGER NOT NULL DEFAULT 0,
    started_at               TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspections_technician ON inspections(technician_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_due_date ON inspections(due_date);
