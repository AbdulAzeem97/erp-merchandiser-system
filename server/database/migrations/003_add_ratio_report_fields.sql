-- Add Ratio Report Fields to Production Planning
-- Tracks whether sheets came from ratio report vs calculation
-- Migration: 003_add_ratio_report_fields.sql

-- Add ratio_report_sheets column to track sheets from ratio report
ALTER TABLE job_production_planning 
ADD COLUMN IF NOT EXISTS ratio_report_sheets INTEGER;

-- Add flag to track if base sheets came from ratio report
ALTER TABLE job_production_planning 
ADD COLUMN IF NOT EXISTS from_ratio_report BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_production_planning_ratio_report 
ON job_production_planning(from_ratio_report);

-- Add comments for documentation
COMMENT ON COLUMN job_production_planning.ratio_report_sheets IS 'Sheets from uploaded ratio report (CSV)';
COMMENT ON COLUMN job_production_planning.from_ratio_report IS 'True if base sheets came from ratio report, false if from calculation';

