-- Migration: Add Cutting Department Workflow
-- Version: 005
-- Description: Adds cutting workflow columns and cutting_assignments table

-- Add cutting workflow columns to job_lifecycles (if table exists)
-- Note: This is optional - the cutting_assignments table is the primary tracking mechanism
DO $$
BEGIN
    -- Check if job_lifecycles table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'job_lifecycles') THEN
        -- Add columns if they don't exist (using camelCase to match existing schema)
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_lifecycles' AND column_name = 'cuttingStatus') THEN
            ALTER TABLE job_lifecycles ADD COLUMN "cuttingStatus" VARCHAR(50) DEFAULT NULL;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_lifecycles' AND column_name = 'cuttingAssignedTo') THEN
            ALTER TABLE job_lifecycles ADD COLUMN "cuttingAssignedTo" INTEGER DEFAULT NULL REFERENCES users(id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_lifecycles' AND column_name = 'cuttingStartedAt') THEN
            ALTER TABLE job_lifecycles ADD COLUMN "cuttingStartedAt" TIMESTAMP NULL;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'job_lifecycles' AND column_name = 'cuttingCompletedAt') THEN
            ALTER TABLE job_lifecycles ADD COLUMN "cuttingCompletedAt" TIMESTAMP NULL;
        END IF;
        
        -- Add comments if table exists
        COMMENT ON COLUMN job_lifecycles."cuttingStatus" IS 'Current cutting workflow status';
        COMMENT ON COLUMN job_lifecycles."cuttingAssignedTo" IS 'User assigned to cutting task';
        COMMENT ON COLUMN job_lifecycles."cuttingStartedAt" IS 'When cutting started';
        COMMENT ON COLUMN job_lifecycles."cuttingCompletedAt" IS 'When cutting completed';
    ELSE
        RAISE NOTICE 'job_lifecycles table does not exist - skipping column additions';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding columns to job_lifecycles: %', SQLERRM;
END $$;

-- Create cutting_assignments table
CREATE TABLE IF NOT EXISTS cutting_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id INTEGER NOT NULL UNIQUE REFERENCES job_cards(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN (
        'Pending',
        'Assigned',
        'In Progress',
        'On Hold',
        'Completed',
        'Rejected'
    )),
    comments TEXT NULL,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cutting_assignments_job_id ON cutting_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_cutting_assignments_assigned_to ON cutting_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cutting_assignments_status ON cutting_assignments(status);
CREATE INDEX IF NOT EXISTS idx_cutting_assignments_created_at ON cutting_assignments(created_at);

-- Add comments
COMMENT ON TABLE cutting_assignments IS 'Cutting department task assignments and status tracking';
COMMENT ON COLUMN cutting_assignments.job_id IS 'Reference to job_card';
COMMENT ON COLUMN cutting_assignments.assigned_by IS 'HOD or admin who assigned the task';
COMMENT ON COLUMN cutting_assignments.assigned_to IS 'Cutting labor assigned to the task';
COMMENT ON COLUMN cutting_assignments.status IS 'Current cutting status';
COMMENT ON COLUMN cutting_assignments.comments IS 'Notes and comments from cutting process';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cutting_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cutting_assignments_updated_at
    BEFORE UPDATE ON cutting_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_cutting_assignments_updated_at();

-- Ensure Cutting is recognized in workflow steps
-- Update job_workflow_steps to support Cutting department if needed
-- (This is handled by the workflow service, but we ensure the structure supports it)

SELECT 'Cutting workflow tables and columns created successfully!' as message;

