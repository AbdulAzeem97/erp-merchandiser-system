-- Migration: Add Offset Printing progress tracking table
-- Description: Creates table for tracking daily and plate-wise progress for each job assignment

-- Create offset_printing_progress table
CREATE TABLE IF NOT EXISTS offset_printing_progress (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES offset_printing_assignments(id) ON DELETE CASCADE,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  plate_number INTEGER NOT NULL, -- Plate sequence number (1, 2, 3, etc.)
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sheets_completed INTEGER DEFAULT 0,
  sheets_target INTEGER, -- Target sheets for this plate on this date
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  operator_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'Not Started', -- Not Started, In Progress, Completed, On Hold
  notes TEXT,
  quality_issues JSONB DEFAULT '[]'::jsonb, -- Array of quality issues encountered
  downtime_minutes INTEGER DEFAULT 0, -- Machine downtime for this plate
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, plate_number, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_offset_progress_assignment ON offset_printing_progress(assignment_id);
CREATE INDEX IF NOT EXISTS idx_offset_progress_job_card ON offset_printing_progress(job_card_id);
CREATE INDEX IF NOT EXISTS idx_offset_progress_date ON offset_printing_progress(date);
CREATE INDEX IF NOT EXISTS idx_offset_progress_plate ON offset_printing_progress(plate_number);
CREATE INDEX IF NOT EXISTS idx_offset_progress_operator ON offset_printing_progress(operator_id);
CREATE INDEX IF NOT EXISTS idx_offset_progress_status ON offset_printing_progress(status);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_offset_printing_progress_updated_at ON offset_printing_progress;
CREATE TRIGGER update_offset_printing_progress_updated_at 
  BEFORE UPDATE ON offset_printing_progress 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE offset_printing_progress IS 'Tracks daily and plate-wise progress for Offset Printing jobs';
COMMENT ON COLUMN offset_printing_progress.assignment_id IS 'Reference to the offset printing assignment';
COMMENT ON COLUMN offset_printing_progress.plate_number IS 'Plate sequence number (1, 2, 3, etc.)';
COMMENT ON COLUMN offset_printing_progress.date IS 'Date of progress entry';
COMMENT ON COLUMN offset_printing_progress.sheets_completed IS 'Number of sheets completed for this plate on this date';
COMMENT ON COLUMN offset_printing_progress.sheets_target IS 'Target number of sheets for this plate on this date';
COMMENT ON COLUMN offset_printing_progress.quality_issues IS 'JSON array of quality issues encountered';



