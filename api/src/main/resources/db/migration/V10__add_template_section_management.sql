ALTER TABLE template_sections RENAME COLUMN sort_order TO display_order;

ALTER TABLE template_sections
    ADD COLUMN description TEXT,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
