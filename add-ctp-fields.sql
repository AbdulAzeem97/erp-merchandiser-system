-- Add CTP (Computer-to-Plate) fields to prepress_jobs table
-- These fields track plate generation status and details

ALTER TABLE prepress_jobs
ADD COLUMN IF NOT EXISTS plate_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plate_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS plate_generated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS plate_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ctp_notes TEXT,
ADD COLUMN IF NOT EXISTS plate_tag_printed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plate_tag_printed_at TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN prepress_jobs.plate_generated IS 'Whether plates have been generated for this job';
COMMENT ON COLUMN prepress_jobs.plate_generated_at IS 'Timestamp when plates were generated';
COMMENT ON COLUMN prepress_jobs.plate_generated_by IS 'CTP operator who generated the plates';
COMMENT ON COLUMN prepress_jobs.plate_count IS 'Number of plates generated for this job';
COMMENT ON COLUMN prepress_jobs.ctp_notes IS 'Notes from CTP department';
COMMENT ON COLUMN prepress_jobs.plate_tag_printed IS 'Whether plate tags have been printed';
COMMENT ON COLUMN prepress_jobs.plate_tag_printed_at IS 'Timestamp when plate tags were printed';

-- Create index for faster CTP queries
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_plate_generated ON prepress_jobs(plate_generated);
CREATE INDEX IF NOT EXISTS idx_prepress_jobs_ctp_status ON prepress_jobs(status) WHERE status IN ('QA_APPROVED', 'PLATE_GENERATED');

SELECT 'CTP fields added to prepress_jobs table successfully!' as message;

