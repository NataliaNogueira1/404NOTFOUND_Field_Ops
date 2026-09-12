CREATE TABLE inspection_template_versions (
    id                   BIGSERIAL PRIMARY KEY,
    template_id          BIGINT NOT NULL REFERENCES inspection_templates(id),
    version_number       INTEGER NOT NULL,
    title_snapshot       VARCHAR(200) NOT NULL,
    description_snapshot TEXT,
    published_by         BIGINT NOT NULL REFERENCES users(id),
    published_at         TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_template_version_number UNIQUE (template_id, version_number)
);

CREATE INDEX idx_template_versions_template ON inspection_template_versions(template_id);
