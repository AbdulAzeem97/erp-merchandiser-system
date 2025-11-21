-- Migration: Add Machine 1 to Machine 5 to ctp_machines table
-- Version: 003
-- Description: Adds 5 new machines (Machine 1 through Machine 5) to the ctp_machines table

INSERT INTO ctp_machines (machine_code, machine_name, machine_type, manufacturer, model, status, location, description, max_plate_size, is_active)
VALUES
  ('MACH-001', 'Machine 1', 'CTP', 'Generic', 'Model 1', 'ACTIVE', 'CTP Room 1', 'CTP Machine 1', '8x10 inches', true),
  ('MACH-002', 'Machine 2', 'CTP', 'Generic', 'Model 2', 'ACTIVE', 'CTP Room 1', 'CTP Machine 2', '8x10 inches', true),
  ('MACH-003', 'Machine 3', 'CTP', 'Generic', 'Model 3', 'ACTIVE', 'CTP Room 2', 'CTP Machine 3', '11x17 inches', true),
  ('MACH-004', 'Machine 4', 'CTP', 'Generic', 'Model 4', 'ACTIVE', 'CTP Room 2', 'CTP Machine 4', '11x17 inches', true),
  ('MACH-005', 'Machine 5', 'CTP', 'Generic', 'Model 5', 'ACTIVE', 'CTP Room 3', 'CTP Machine 5', '14x20 inches', true)
ON CONFLICT (machine_code) DO NOTHING;

