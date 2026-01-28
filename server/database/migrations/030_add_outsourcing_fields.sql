-- Migration: Add outsourcing fields to prepress_jobs
-- Description: Adds tracking for outsourcing requests (Die Making, Fil, Blocks)

ALTER TABLE prepress_jobs 
ADD COLUMN IF NOT EXISTS outsourcing_die_making_initiated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fil_initiated_request BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocks_initiated BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN prepress_jobs.outsourcing_die_making_initiated IS 'Track if die making outsourcing has been initiated';
COMMENT ON COLUMN prepress_jobs.fil_initiated_request IS 'Track if Fil request has been initiated';
COMMENT ON COLUMN prepress_jobs.blocks_initiated IS 'Track if blocks outsourcing has been initiated';
