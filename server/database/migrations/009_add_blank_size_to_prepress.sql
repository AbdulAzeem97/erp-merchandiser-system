-- Migration: Add blank size columns to prepress_jobs table
-- This allows storing blank dimensions in both mm and inches with unit tracking

-- Add blank size columns to prepress_jobs table
ALTER TABLE prepress_jobs 
ADD COLUMN IF NOT EXISTS blank_width_mm DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_height_mm DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_width_inches DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_height_inches DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS blank_size_unit VARCHAR(10) DEFAULT 'mm';

-- Add comments for documentation
COMMENT ON COLUMN prepress_jobs.blank_width_mm IS 'Blank width in millimeters';
COMMENT ON COLUMN prepress_jobs.blank_height_mm IS 'Blank height in millimeters';
COMMENT ON COLUMN prepress_jobs.blank_width_inches IS 'Blank width in inches';
COMMENT ON COLUMN prepress_jobs.blank_height_inches IS 'Blank height in inches';
COMMENT ON COLUMN prepress_jobs.blank_size_unit IS 'Unit used for input: mm or inches';

-- Add indexes for performance (useful for queries filtering by blank size)
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_blank_size ON prepress_jobs(blank_width_mm, blank_height_mm);

-- Add check constraint to ensure at least one unit is provided
ALTER TABLE prepress_jobs
ADD CONSTRAINT check_blank_size_unit 
CHECK (blank_size_unit IN ('mm', 'inches') OR blank_size_unit IS NULL);

