-- Migration: Add job_ctp_machines table for multiple machines per job
-- Description: Creates a table to store multiple CTP machines with plate counts for each job

-- Create job_ctp_machines table
CREATE TABLE IF NOT EXISTS job_ctp_machines (
  id SERIAL PRIMARY KEY,
  prepress_job_id INTEGER NOT NULL REFERENCES prepress_jobs(id) ON DELETE CASCADE,
  ctp_machine_id INTEGER NOT NULL REFERENCES ctp_machines(id) ON DELETE CASCADE,
  plate_count INTEGER NOT NULL DEFAULT 0 CHECK (plate_count >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(prepress_job_id, ctp_machine_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_ctp_machines_prepress_job ON job_ctp_machines(prepress_job_id);
CREATE INDEX IF NOT EXISTS idx_job_ctp_machines_ctp_machine ON job_ctp_machines(ctp_machine_id);
CREATE INDEX IF NOT EXISTS idx_job_ctp_machines_created_at ON job_ctp_machines(created_at);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_job_ctp_machines_updated_at ON job_ctp_machines;
CREATE TRIGGER update_job_ctp_machines_updated_at 
  BEFORE UPDATE ON job_ctp_machines 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE job_ctp_machines IS 'Stores multiple CTP machines with plate counts for each prepress job';
COMMENT ON COLUMN job_ctp_machines.prepress_job_id IS 'Reference to the prepress job';
COMMENT ON COLUMN job_ctp_machines.ctp_machine_id IS 'Reference to the CTP machine';
COMMENT ON COLUMN job_ctp_machines.plate_count IS 'Number of plates required for this machine in this job';

