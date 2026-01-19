-- Migration: Enhance offset_printing_assignments table
-- Description: Adds fields for overall progress tracking to offset_printing_assignments table

-- Add progress tracking columns
ALTER TABLE offset_printing_assignments 
ADD COLUMN IF NOT EXISTS total_plates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_plates INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sheets_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sheets_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS overall_progress_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_completion_date DATE,
ADD COLUMN IF NOT EXISTS current_plate_number INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shift_start_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS shift_end_time TIMESTAMP;

-- Add comments
COMMENT ON COLUMN offset_printing_assignments.total_plates IS 'Total number of plates required for this job';
COMMENT ON COLUMN offset_printing_assignments.completed_plates IS 'Number of plates completed so far';
COMMENT ON COLUMN offset_printing_assignments.total_sheets_target IS 'Total target number of sheets for the entire job';
COMMENT ON COLUMN offset_printing_assignments.total_sheets_completed IS 'Total number of sheets completed so far';
COMMENT ON COLUMN offset_printing_assignments.overall_progress_percentage IS 'Overall job progress percentage (0-100)';
COMMENT ON COLUMN offset_printing_assignments.estimated_completion_date IS 'Estimated date of job completion based on current progress';
COMMENT ON COLUMN offset_printing_assignments.current_plate_number IS 'Current plate number being worked on';
COMMENT ON COLUMN offset_printing_assignments.shift_start_time IS 'Shift start time';
COMMENT ON COLUMN offset_printing_assignments.shift_end_time IS 'Shift end time';



