-- Add ratio optimization fields to job_cards table
-- This allows merchandisers to upload UPS optimization data before job creation

ALTER TABLE job_cards 
ADD COLUMN IF NOT EXISTS ratio_report_link TEXT,
ADD COLUMN IF NOT EXISTS ratio_pdf_link TEXT,
ADD COLUMN IF NOT EXISTS total_ups INTEGER,
ADD COLUMN IF NOT EXISTS total_sheets INTEGER,
ADD COLUMN IF NOT EXISTS total_plates INTEGER,
ADD COLUMN IF NOT EXISTS required_order_qty INTEGER,
ADD COLUMN IF NOT EXISTS qty_produced INTEGER,
ADD COLUMN IF NOT EXISTS excess_qty INTEGER,
ADD COLUMN IF NOT EXISTS production_efficiency DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS excess_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS ratio_data JSONB,
ADD COLUMN IF NOT EXISTS plate_distribution JSONB,
ADD COLUMN IF NOT EXISTS color_efficiency JSONB;

-- Add comments for documentation
COMMENT ON COLUMN job_cards.ratio_report_link IS 'Google Drive link to ratio optimization report (CSV/PDF)';
COMMENT ON COLUMN job_cards.ratio_pdf_link IS 'Google Drive link to ratio PDF report';
COMMENT ON COLUMN job_cards.total_ups IS 'Total Units Per Sheet from ratio software';
COMMENT ON COLUMN job_cards.total_sheets IS 'Total sheets required for production';
COMMENT ON COLUMN job_cards.total_plates IS 'Total plates needed for printing';
COMMENT ON COLUMN job_cards.required_order_qty IS 'Required order quantity from ratio calculation';
COMMENT ON COLUMN job_cards.qty_produced IS 'Actual quantity that will be produced';
COMMENT ON COLUMN job_cards.excess_qty IS 'Excess quantity (waste)';
COMMENT ON COLUMN job_cards.production_efficiency IS 'Production efficiency percentage';
COMMENT ON COLUMN job_cards.excess_percentage IS 'Excess percentage';
COMMENT ON COLUMN job_cards.ratio_data IS 'Complete ratio report data in JSON format';
COMMENT ON COLUMN job_cards.plate_distribution IS 'Plate usage distribution data';
COMMENT ON COLUMN job_cards.color_efficiency IS 'Color-wise efficiency data';
