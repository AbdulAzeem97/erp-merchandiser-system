-- Migration: Add Plate Count and CTP Machine to Prepress Jobs
-- Version: 002
-- Description: Adds required_plate_count and ctp_machine_id fields to prepress_jobs table, and creates ctp_machines table

-- 1. Create CTP Machines table
CREATE TABLE IF NOT EXISTS ctp_machines (
  id SERIAL PRIMARY KEY,
  machine_code VARCHAR(50) UNIQUE NOT NULL,
  machine_name VARCHAR(100) NOT NULL,
  machine_type VARCHAR(50) NOT NULL DEFAULT 'CTP',
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED')),
  location VARCHAR(100),
  description TEXT,
  max_plate_size VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add plate count and machine fields to prepress_jobs table
ALTER TABLE prepress_jobs
  ADD COLUMN IF NOT EXISTS required_plate_count INTEGER,
  ADD COLUMN IF NOT EXISTS ctp_machine_id INTEGER REFERENCES ctp_machines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plate_machine_updated_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS plate_machine_updated_at TIMESTAMP WITHOUT TIME ZONE;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_plate_count ON prepress_jobs(required_plate_count);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_ctp_machine ON prepress_jobs(ctp_machine_id);
CREATE INDEX IF NOT EXISTS idx_ctp_machines_status ON ctp_machines(status);
CREATE INDEX IF NOT EXISTS idx_ctp_machines_active ON ctp_machines(is_active);

-- 4. Create or replace function for updated_at trigger (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for updated_at on ctp_machines
DROP TRIGGER IF EXISTS update_ctp_machines_updated_at ON ctp_machines;
CREATE TRIGGER update_ctp_machines_updated_at 
  BEFORE UPDATE ON ctp_machines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Seed CTP Machines data
INSERT INTO ctp_machines (machine_code, machine_name, machine_type, manufacturer, model, status, location, description, max_plate_size)
VALUES
  ('CTP-001', 'CTP Plate Maker 1', 'CTP', 'Kodak', 'Trendsetter 800', 'ACTIVE', 'CTP Room 1', 'Main CTP plate making machine', '8x10 inches'),
  ('CTP-002', 'CTP Plate Maker 2', 'CTP', 'Fuji', 'Luxel V-6', 'ACTIVE', 'CTP Room 1', 'Secondary CTP plate making machine', '11x17 inches'),
  ('CTP-003', 'CTP Plate Maker 3', 'CTP', 'Screen', 'PlateRite 8600', 'ACTIVE', 'CTP Room 2', 'High-speed CTP plate making machine', '8x10 inches'),
  ('CTP-004', 'CTP Plate Maker 4', 'CTP', 'Heidelberg', 'Suprasetter', 'ACTIVE', 'CTP Room 2', 'Large format CTP plate making machine', '11x17 inches'),
  ('CTP-005', 'CTP Plate Maker 5', 'CTP', 'Agfa', 'Avalon VLF', 'ACTIVE', 'CTP Room 3', 'Very large format CTP plate making machine', '14x20 inches')
ON CONFLICT (machine_code) DO NOTHING;

-- 6. Add comments
COMMENT ON TABLE ctp_machines IS 'CTP (Computer-to-Plate) machines available for plate production';
COMMENT ON COLUMN prepress_jobs.required_plate_count IS 'Number of plates required for this job (set by designer/HOD)';
COMMENT ON COLUMN prepress_jobs.ctp_machine_id IS 'CTP machine assigned for this job';
COMMENT ON COLUMN prepress_jobs.plate_machine_updated_by IS 'User who updated plate count and machine assignment';
COMMENT ON COLUMN prepress_jobs.plate_machine_updated_at IS 'Timestamp when plate count and machine were updated';

