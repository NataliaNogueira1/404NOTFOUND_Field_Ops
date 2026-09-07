ALTER TABLE inspection_templates RENAME COLUMN version TO current_version;

ALTER TABLE inspection_templates
    ADD COLUMN description TEXT,
    ADD COLUMN status VARCHAR(10),
    ADD COLUMN created_by BIGINT,
    ADD COLUMN version INTEGER NOT NULL DEFAULT 0;

UPDATE inspection_templates
SET status = CASE WHEN published THEN 'ACTIVE' ELSE 'DRAFT' END;

UPDATE inspection_templates
SET created_by = (SELECT id FROM users ORDER BY id LIMIT 1)
WHERE created_by IS NULL;

ALTER TABLE inspection_templates
    ALTER COLUMN current_version SET DEFAULT 0,
    ALTER COLUMN status SET DEFAULT 'DRAFT',
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_by SET NOT NULL,
    ADD CONSTRAINT fk_inspection_templates_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    ADD CONSTRAINT chk_inspection_templates_status
        CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE'));

ALTER TABLE inspection_templates DROP COLUMN published;
