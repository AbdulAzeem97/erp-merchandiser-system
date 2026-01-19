-- Migration: Add Offset Printing workflow tables and columns
-- Description: Creates tables and columns for Offset Printing department workflow

-- Create offset_printing_assignments table
CREATE TABLE IF NOT EXISTS offset_printing_assignments (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  prepress_job_id INTEGER REFERENCES prepress_jobs(id),
  ctp_machine_id INTEGER REFERENCES ctp_machines(id),
  assigned_to INTEGER REFERENCES users(id),
  assigned_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'Pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  material_consumed JSONB,
  quality_metrics JSONB,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_card_id, ctp_machine_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_offset_printing_assignments_job_card ON offset_printing_assignments(job_card_id);
CREATE INDEX IF NOT EXISTS idx_offset_printing_assignments_prepress_job ON offset_printing_assignments(prepress_job_id);
CREATE INDEX IF NOT EXISTS idx_offset_printing_assignments_machine ON offset_printing_assignments(ctp_machine_id);
CREATE INDEX IF NOT EXISTS idx_offset_printing_assignments_assigned_to ON offset_printing_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_offset_printing_assignments_status ON offset_printing_assignments(status);
CREATE INDEX IF NOT EXISTS idx_offset_printing_assignments_created_at ON offset_printing_assignments(created_at);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_offset_printing_assignments_updated_at ON offset_printing_assignments;
CREATE TRIGGER update_offset_printing_assignments_updated_at 
  BEFORE UPDATE ON offset_printing_assignments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE offset_printing_assignments IS 'Stores job assignments to machines and operators for Offset Printing department';
COMMENT ON COLUMN offset_printing_assignments.job_card_id IS 'Reference to the job card';
COMMENT ON COLUMN offset_printing_assignments.prepress_job_id IS 'Reference to the prepress job (for machine lookup)';
COMMENT ON COLUMN offset_printing_assignments.ctp_machine_id IS 'Reference to the CTP machine selected by designer';
COMMENT ON COLUMN offset_printing_assignments.assigned_to IS 'Operator assigned to this job';
COMMENT ON COLUMN offset_printing_assignments.status IS 'Current status: Pending, Assigned, Setup, Printing, Quality Check, Completed, On Hold, Rejected';



