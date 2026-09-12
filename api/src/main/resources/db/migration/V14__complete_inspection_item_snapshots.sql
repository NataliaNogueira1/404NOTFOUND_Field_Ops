ALTER TABLE template_items
    ADD COLUMN code VARCHAR(100);

ALTER TABLE inspections
    ADD COLUMN template_version_id BIGINT REFERENCES inspection_template_versions(id);

ALTER TABLE inspection_item_snapshots
    RENAME COLUMN template_item_id TO source_template_item_id;

ALTER TABLE inspection_item_snapshots
    ADD COLUMN section_title VARCHAR(200),
    ADD COLUMN section_order INTEGER,
    ADD COLUMN item_code VARCHAR(100),
    ADD COLUMN item_title VARCHAR(500),
    ADD COLUMN item_description VARCHAR(1000),
    ADD COLUMN response_type VARCHAR(30),
    ADD COLUMN required BOOLEAN,
    ADD COLUMN options_json TEXT,
    ADD COLUMN item_order INTEGER;

UPDATE inspection_item_snapshots snapshot
SET section_title = section.title,
    section_order = section.display_order,
    item_code = item.code,
    item_title = item.question,
    item_description = item.description,
    response_type = item.response_type,
    required = item.required,
    options_json = item.options_json,
    item_order = item.display_order
FROM template_items item
JOIN template_sections section ON section.id = item.section_id
WHERE item.id = snapshot.source_template_item_id;

-- Older minimal snapshots may reference an item that has since been removed. Their
-- unavailable historical fields receive explicit legacy values so the migration is safe.
UPDATE inspection_item_snapshots
SET section_title = COALESCE(section_title, 'Historical section'),
    section_order = COALESCE(section_order, 0),
    item_title = COALESCE(item_title, 'Historical item ' || source_template_item_id),
    response_type = COALESCE(response_type, 'TEXT_SHORT'),
    required = COALESCE(required, FALSE),
    item_order = COALESCE(item_order, 0);

ALTER TABLE inspection_item_snapshots
    ALTER COLUMN section_title SET NOT NULL,
    ALTER COLUMN section_order SET NOT NULL,
    ALTER COLUMN item_title SET NOT NULL,
    ALTER COLUMN response_type SET NOT NULL,
    ALTER COLUMN required SET NOT NULL,
    ALTER COLUMN item_order SET NOT NULL;

ALTER TABLE inspection_item_snapshots
    RENAME CONSTRAINT uk_inspection_item_snapshot TO uk_inspection_source_item_snapshot;

CREATE INDEX idx_inspections_template_version ON inspections(template_version_id);
