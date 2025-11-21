-- Migration: Add Job Workflow Steps Table
-- Version: 003
-- Description: Creates job_workflow_steps table for dynamic workflow tracking based on product process sequences

-- Create job_workflow_steps table
-- Note: job_card_id type should match job_cards.id type (UUID or INTEGER)
-- Using TEXT initially to be flexible, can be changed based on actual schema
CREATE TABLE IF NOT EXISTS job_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  requires_qa BOOLEAN DEFAULT false,
  auto_action BOOLEAN DEFAULT false, -- e.g., auto-complete after CTP generation
  status VARCHAR(50) NOT NULL DEFAULT 'inactive' CHECK (status IN (
    'inactive',
    'pending',
    'in_progress',
    'submitted',
    'qa_review',
    'revision_required',
    'approved',
    'completed'
  )),
  status_message TEXT,
  assigned_to INTEGER REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_card_id, sequence_number)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_job_card ON job_workflow_steps(job_card_id);
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_status ON job_workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_department ON job_workflow_steps(department);
CREATE INDEX IF NOT EXISTS idx_job_workflow_steps_sequence ON job_workflow_steps(job_card_id, sequence_number);

-- Add comments
COMMENT ON TABLE job_workflow_steps IS 'Dynamic workflow steps for each job, generated from product process sequence';
COMMENT ON COLUMN job_workflow_steps.sequence_number IS 'Order of step in workflow (1, 2, 3...)';
COMMENT ON COLUMN job_workflow_steps.step_name IS 'Name of the workflow step (e.g., Design, CTP, Printing)';
COMMENT ON COLUMN job_workflow_steps.department IS 'Department responsible for this step (e.g., Prepress, Production)';
COMMENT ON COLUMN job_workflow_steps.requires_qa IS 'Whether this step requires QA review';
COMMENT ON COLUMN job_workflow_steps.auto_action IS 'Whether this step auto-completes after certain actions';
COMMENT ON COLUMN job_workflow_steps.status IS 'Current status of this workflow step';
COMMENT ON COLUMN job_workflow_steps.status_message IS 'Auto-generated status message';

-- Add workflow tracking columns to job_cards (for backward compatibility and quick access)
ALTER TABLE job_cards
  ADD COLUMN IF NOT EXISTS current_step VARCHAR(255),
  ADD COLUMN IF NOT EXISTS current_department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) CHECK (workflow_status IN (
    'pending',
    'in_progress',
    'submitted',
    'qa_review',
    'approved',
    'rejected',
    'revision_required',
    'completed'
  )),
  ADD COLUMN IF NOT EXISTS status_message TEXT,
  ADD COLUMN IF NOT EXISTS last_updated_by INTEGER REFERENCES users(id);

-- Create index for workflow queries
CREATE INDEX IF NOT EXISTS idx_job_cards_workflow_status ON job_cards(workflow_status);
CREATE INDEX IF NOT EXISTS idx_job_cards_current_step ON job_cards(current_step);
CREATE INDEX IF NOT EXISTS idx_job_cards_current_department ON job_cards(current_department);

COMMENT ON COLUMN job_cards.current_step IS 'Current active workflow step name';
COMMENT ON COLUMN job_cards.current_department IS 'Current active department';
COMMENT ON COLUMN job_cards.workflow_status IS 'Unified workflow status';
COMMENT ON COLUMN job_cards.status_message IS 'Auto-generated status message';

SELECT 'Job workflow steps table created successfully!' as message;

