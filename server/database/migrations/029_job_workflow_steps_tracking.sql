-- Migration: Add Tracking Fields to Job Workflow Steps
-- Version: 029
-- Description: Adds output_qty and created_by columns to job_workflow_steps for complete step tracking

-- Add output_qty column (quantity produced/processed at this step)
ALTER TABLE job_workflow_steps
  ADD COLUMN IF NOT EXISTS output_qty INTEGER NULL;

-- Add created_by column (user who created the workflow step record)
ALTER TABLE job_workflow_steps
  ADD COLUMN IF NOT EXISTS created_by INTEGER NULL REFERENCES users(id);

-- Add comments
COMMENT ON COLUMN job_workflow_steps.output_qty IS 'Quantity produced or processed at this workflow step';
COMMENT ON COLUMN job_workflow_steps.created_by IS 'User who created this workflow step record (for audit trail)';

-- Create index on created_by for faster queries
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_created_by ON job_workflow_steps(created_by);

-- Update existing records: set created_by to updated_by if available, or NULL
UPDATE job_workflow_steps
SET created_by = updated_by
WHERE created_by IS NULL AND updated_by IS NOT NULL;

SELECT 'Job workflow steps tracking fields added successfully!' as message;
