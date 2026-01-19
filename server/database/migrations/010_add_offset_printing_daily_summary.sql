-- Migration: Add Offset Printing daily summary table
-- Description: Creates table for aggregating daily production metrics for reporting and analytics

-- Create offset_printing_daily_summary table
CREATE TABLE IF NOT EXISTS offset_printing_daily_summary (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES offset_printing_assignments(id) ON DELETE CASCADE,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_sheets_completed INTEGER DEFAULT 0,
  total_plates_completed INTEGER DEFAULT 0,
  total_plates_in_progress INTEGER DEFAULT 0,
  total_downtime_minutes INTEGER DEFAULT 0,
  efficiency_percentage DECIMAL(5,2), -- Calculated efficiency
  material_consumed JSONB DEFAULT '{}'::jsonb, -- Daily material consumption
  quality_metrics JSONB DEFAULT '{}'::jsonb, -- Daily quality metrics
  operator_id INTEGER REFERENCES users(id),
  shift VARCHAR(20), -- Morning, Afternoon, Night
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(assignment_id, date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_offset_daily_summary_assignment ON offset_printing_daily_summary(assignment_id);
CREATE INDEX IF NOT EXISTS idx_offset_daily_summary_job_card ON offset_printing_daily_summary(job_card_id);
CREATE INDEX IF NOT EXISTS idx_offset_daily_summary_date ON offset_printing_daily_summary(date);
CREATE INDEX IF NOT EXISTS idx_offset_daily_summary_operator ON offset_printing_daily_summary(operator_id);
CREATE INDEX IF NOT EXISTS idx_offset_daily_summary_shift ON offset_printing_daily_summary(shift);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_offset_printing_daily_summary_updated_at ON offset_printing_daily_summary;
CREATE TRIGGER update_offset_printing_daily_summary_updated_at 
  BEFORE UPDATE ON offset_printing_daily_summary 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE offset_printing_daily_summary IS 'Aggregates daily production metrics for Offset Printing jobs';
COMMENT ON COLUMN offset_printing_daily_summary.total_sheets_completed IS 'Total sheets completed on this date';
COMMENT ON COLUMN offset_printing_daily_summary.total_plates_completed IS 'Total plates completed on this date';
COMMENT ON COLUMN offset_printing_daily_summary.efficiency_percentage IS 'Calculated production efficiency percentage';
COMMENT ON COLUMN offset_printing_daily_summary.material_consumed IS 'JSON object tracking daily material consumption';
COMMENT ON COLUMN offset_printing_daily_summary.quality_metrics IS 'JSON object storing daily quality check results';



