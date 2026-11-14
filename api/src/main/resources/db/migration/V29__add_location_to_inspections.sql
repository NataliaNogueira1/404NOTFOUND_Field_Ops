-- PBI-045: persist the one-shot GPS location captured by the mobile app at the
-- start and at the conclusion of an inspection (RN-060/RN-061/RN-062). All
-- columns are nullable because capturing the location is optional: the
-- technician may opt out or deny the permission and still proceed (RN-059).
ALTER TABLE inspections ADD COLUMN start_latitude    DOUBLE PRECISION;
ALTER TABLE inspections ADD COLUMN start_longitude   DOUBLE PRECISION;
ALTER TABLE inspections ADD COLUMN start_accuracy    DOUBLE PRECISION;
ALTER TABLE inspections ADD COLUMN start_captured_at TIMESTAMPTZ;
ALTER TABLE inspections ADD COLUMN end_latitude      DOUBLE PRECISION;
ALTER TABLE inspections ADD COLUMN end_longitude     DOUBLE PRECISION;
ALTER TABLE inspections ADD COLUMN end_accuracy      DOUBLE PRECISION;
ALTER TABLE inspections ADD COLUMN end_captured_at   TIMESTAMPTZ;
