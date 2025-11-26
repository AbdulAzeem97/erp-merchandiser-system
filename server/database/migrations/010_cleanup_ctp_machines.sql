-- Migration: Cleanup CTP machines - Keep only specified machines
-- Description: Removes generic and unwanted machines, keeps only: SM52 (one), SORK-Z, SMZ72, CD74, GTO-52, GTO-45
-- Version: 010

-- First, deactivate or delete all machines that are not in the allowed list
-- We'll mark them as inactive first to be safe, then delete if needed

-- Delete generic machines (MACH-001 through MACH-005)
DELETE FROM ctp_machines WHERE machine_code LIKE 'MACH-%';

-- Delete CTP-001 through CTP-005 (old generic machines)
DELETE FROM ctp_machines WHERE machine_code LIKE 'CTP-%';

-- Delete all SM52 variants except SM52-1 (keeping only one SM52 as requested)
DELETE FROM ctp_machines WHERE machine_code IN ('SM52-2', 'SM52-5');

-- Delete GTO-46-1 if user wants GTO-45 instead (we'll add GTO-45 below)
DELETE FROM ctp_machines WHERE machine_code = 'GTO-46-1';

-- Now ensure we have only the required machines
-- Delete any other machines not in our allowed list
DELETE FROM ctp_machines 
WHERE machine_code NOT IN ('SM52-1', 'SORK-Z', 'SM72-Z', 'CD74', 'GTO-52-1', 'GTO-45-1');

-- Insert or update the required machines
INSERT INTO ctp_machines (machine_code, machine_name, machine_type, manufacturer, model, status, location, description, max_plate_size, is_active)
VALUES
  ('SM52-1', 'SM52', 'CTP', 'Heidelberg', 'SM52', 'ACTIVE', 'CTP Room 1', 'Heidelberg SM52 CTP machine', 'Standard', true),
  ('SORK-Z', 'SORK-Z', 'CTP', 'Heidelberg', 'SORK-Z', 'ACTIVE', 'CTP Room 1', 'Heidelberg SORK-Z CTP machine', 'Standard', true),
  ('SM72-Z', 'SMZ72', 'CTP', 'Heidelberg', 'SMZ72', 'ACTIVE', 'CTP Room 1', 'Heidelberg SMZ72 CTP machine', 'Standard', true),
  ('CD74', 'CD74', 'CTP', 'Heidelberg', 'CD74', 'ACTIVE', 'CTP Room 2', 'Heidelberg CD74 CTP machine', 'Standard', true),
  ('GTO-52-1', 'GTO 52', 'CTP', 'Heidelberg', 'GTO 52', 'ACTIVE', 'CTP Room 2', 'Heidelberg GTO 52 CTP machine', 'Standard', true),
  ('GTO-45-1', 'GTO 45', 'CTP', 'Heidelberg', 'GTO 45', 'ACTIVE', 'CTP Room 3', 'Heidelberg GTO 45 CTP machine', 'Standard', true)
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

-- Verify only the required machines exist
DO $$
DECLARE
  machine_count INTEGER;
  allowed_machines TEXT[] := ARRAY['SM52-1', 'SORK-Z', 'SM72-Z', 'CD74', 'GTO-52-1', 'GTO-45-1'];
BEGIN
  SELECT COUNT(*) INTO machine_count 
  FROM ctp_machines 
  WHERE machine_code = ANY(allowed_machines) AND is_active = true;
  
  RAISE NOTICE 'CTP machines after cleanup: % machines', machine_count;
  
  -- Check if any unwanted machines still exist
  IF EXISTS (
    SELECT 1 FROM ctp_machines 
    WHERE machine_code != ALL(allowed_machines) AND is_active = true
  ) THEN
    RAISE WARNING 'Some unwanted machines may still exist. Please check manually.';
  END IF;
END $$;

