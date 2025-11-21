-- Migration: Update CTP machines with provided machine names
-- Description: Updates existing machines or creates new ones with the provided machine codes

-- First, clear existing test machines (optional - comment out if you want to keep them)
-- DELETE FROM ctp_machines WHERE machine_code LIKE 'MACH-%' OR machine_code LIKE 'CTP-%';

-- Insert or update machines with the provided names
-- Using INSERT ... ON CONFLICT to handle duplicates
INSERT INTO ctp_machines (machine_code, machine_name, machine_type, manufacturer, model, status, location, description, max_plate_size, is_active)
VALUES
  ('CD74', 'CD74', 'CTP', 'Heidelberg', 'CD74', 'ACTIVE', 'CTP Room 1', 'Heidelberg CD74 CTP machine', 'Standard', true),
  ('SM52-5', 'SM52-5', 'CTP', 'Heidelberg', 'SM52-5', 'ACTIVE', 'CTP Room 1', 'Heidelberg SM52-5 CTP machine', 'Standard', true),
  ('SM72-Z', 'SM72-Z', 'CTP', 'Heidelberg', 'SM72-Z', 'ACTIVE', 'CTP Room 1', 'Heidelberg SM72-Z CTP machine', 'Standard', true),
  ('SORK-Z', 'SORK-Z', 'CTP', 'Heidelberg', 'SORK-Z', 'ACTIVE', 'CTP Room 2', 'Heidelberg SORK-Z CTP machine', 'Standard', true),
  ('SM52-2', 'SM52-2', 'CTP', 'Heidelberg', 'SM52-2', 'ACTIVE', 'CTP Room 2', 'Heidelberg SM52-2 CTP machine', 'Standard', true),
  ('SM52-1', 'SM52-1', 'CTP', 'Heidelberg', 'SM52-1', 'ACTIVE', 'CTP Room 2', 'Heidelberg SM52-1 CTP machine', 'Standard', true),
  ('GTO-52-1', 'GTO-52-1', 'CTP', 'Heidelberg', 'GTO-52-1', 'ACTIVE', 'CTP Room 3', 'Heidelberg GTO-52-1 CTP machine', 'Standard', true),
  ('GTO-46-1', 'GTO-46-1', 'CTP', 'Heidelberg', 'GTO-46-1', 'ACTIVE', 'CTP Room 3', 'Heidelberg GTO-46-1 CTP machine', 'Standard', true)
ON CONFLICT (machine_code) 
DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  machine_type = EXCLUDED.machine_type,
  manufacturer = EXCLUDED.manufacturer,
  model = EXCLUDED.model,
  status = EXCLUDED.status,
  location = EXCLUDED.location,
  description = EXCLUDED.description,
  max_plate_size = EXCLUDED.max_plate_size,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- Verify machines were inserted/updated
DO $$
DECLARE
  machine_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO machine_count FROM ctp_machines WHERE machine_code IN ('CD74', 'SM52-5', 'SM72-Z', 'SORK-Z', 'SM52-2', 'SM52-1', 'GTO-52-1', 'GTO-46-1');
  RAISE NOTICE 'CTP machines updated: % machines with provided names', machine_count;
END $$;

