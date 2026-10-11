-- PBI-041: store the equipment QR code on the inspection snapshot so the mobile
-- app can confirm equipment identity by scanning the physical QR Code offline.
ALTER TABLE inspections ADD COLUMN equipment_qr_code VARCHAR(200);
