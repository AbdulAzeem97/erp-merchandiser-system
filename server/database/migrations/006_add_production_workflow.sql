-- Migration: Add Production Department Workflow Support
-- Creates production_assignments and production_machines tables
-- Extends workflow system for Production department

-- Create production_machines table if it doesn't exist
CREATE TABLE IF NOT EXISTS production_machines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  machine_type VARCHAR(100) NOT NULL, -- 'Offset', 'Digital', 'Screen'
  status VARCHAR(50) DEFAULT 'Available', -- 'Available', 'In Use', 'Maintenance'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create production_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS production_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  machine_id INTEGER REFERENCES production_machines(id),
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Assigned', 'Setup', 'Printing', 'Quality Check', 'Completed', 'On Hold', 'Rejected'
  comments TEXT,
  material_consumed JSONB,
  quality_metrics JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_job_assignment UNIQUE (job_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_assignments_job_id ON production_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_production_assignments_assigned_to ON production_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_production_assignments_machine_id ON production_assignments(machine_id);
CREATE INDEX IF NOT EXISTS idx_production_assignments_status ON production_assignments(status);
CREATE INDEX IF NOT EXISTS idx_production_machines_type ON production_machines(machine_type);
CREATE INDEX IF NOT EXISTS idx_production_machines_status ON production_machines(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_production_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_production_assignments_updated_at ON production_assignments;
CREATE TRIGGER trigger_update_production_assignments_updated_at
  BEFORE UPDATE ON production_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_production_assignments_updated_at();

-- Insert default production machines (if they don't exist)
INSERT INTO production_machines (name, machine_type, status, is_active)
SELECT * FROM (VALUES
  ('Offset Press 1', 'Offset', 'Available', true),
  ('Offset Press 2', 'Offset', 'Available', true),
  ('Digital Press 1', 'Digital', 'Available', true),
  ('Digital Press 2', 'Digital', 'Available', true),
  ('Screen Printer 1', 'Screen', 'Available', true)
) AS v(name, machine_type, status, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM production_machines WHERE name = v.name
);

-- Add comments for documentation
COMMENT ON TABLE production_machines IS 'Production machines available for job assignments';
COMMENT ON TABLE production_assignments IS 'Production job assignments linking jobs to operators and machines';
COMMENT ON COLUMN production_assignments.material_consumed IS 'JSON object tracking material consumption (paper, ink, etc.)';
COMMENT ON COLUMN production_assignments.quality_metrics IS 'JSON object storing quality check results';

