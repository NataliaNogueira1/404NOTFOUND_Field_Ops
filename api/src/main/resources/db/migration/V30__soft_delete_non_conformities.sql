ALTER TABLE non_conformities
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN deleted_by BIGINT REFERENCES users(id);
