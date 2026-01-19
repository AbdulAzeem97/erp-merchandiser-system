-- Migration: Add index for job creator filtering
-- Description: Adds index on job_cards.createdById for efficient user-based filtering

-- Create index for better query performance when filtering jobs by creator
CREATE INDEX IF NOT EXISTS idx_job_cards_created_by ON job_cards("createdById");

COMMENT ON INDEX idx_job_cards_created_by IS 'Index for filtering jobs by creator (merchandiser-specific job filtering)';

