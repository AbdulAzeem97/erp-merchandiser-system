-- Create ratio_reports table to store production ratio analysis data
-- This table stores the uploaded ratio Excel data for each job

CREATE TABLE IF NOT EXISTS ratio_reports (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  excel_file_link TEXT,
  excel_file_name TEXT,
  factory_name VARCHAR(255),
  po_number VARCHAR(100),
  job_number VARCHAR(100),
  brand_name VARCHAR(255),
  item_name VARCHAR(255),
  report_date DATE,
  total_ups INTEGER,
  total_sheets INTEGER,
  total_plates INTEGER,
  qty_produced INTEGER,
  excess_qty INTEGER,
  efficiency_percentage DECIMAL(5,2),
  excess_percentage DECIMAL(5,2),
  required_order_qty INTEGER,
  color_details JSONB,
  plate_distribution JSONB,
  color_efficiency JSONB,
  raw_excel_data JSONB,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ratio_reports_job_card_id ON ratio_reports(job_card_id);
CREATE INDEX IF NOT EXISTS idx_ratio_reports_created_at ON ratio_reports(created_at);

-- Add comments for documentation
COMMENT ON TABLE ratio_reports IS 'Stores production ratio analysis data from uploaded Excel files';
COMMENT ON COLUMN ratio_reports.job_card_id IS 'Reference to the job card';
COMMENT ON COLUMN ratio_reports.excel_file_link IS 'Google Drive link to the uploaded Excel file';
COMMENT ON COLUMN ratio_reports.excel_file_name IS 'Name of the uploaded Excel file';
COMMENT ON COLUMN ratio_reports.factory_name IS 'Factory name from ratio report';
COMMENT ON COLUMN ratio_reports.total_ups IS 'Total Units Per Sheet';
COMMENT ON COLUMN ratio_reports.total_sheets IS 'Total sheets required';
COMMENT ON COLUMN ratio_reports.total_plates IS 'Total plates required';
COMMENT ON COLUMN ratio_reports.qty_produced IS 'Quantity to be produced';
COMMENT ON COLUMN ratio_reports.excess_qty IS 'Excess quantity (waste)';
COMMENT ON COLUMN ratio_reports.efficiency_percentage IS 'Production efficiency percentage';
COMMENT ON COLUMN ratio_reports.excess_percentage IS 'Excess/waste percentage';
COMMENT ON COLUMN ratio_reports.required_order_qty IS 'Required order quantity';
COMMENT ON COLUMN ratio_reports.color_details IS 'Array of color-wise production details (JSON)';
COMMENT ON COLUMN ratio_reports.plate_distribution IS 'Plate usage distribution data (JSON)';
COMMENT ON COLUMN ratio_reports.color_efficiency IS 'Color-wise efficiency metrics (JSON)';
COMMENT ON COLUMN ratio_reports.raw_excel_data IS 'Complete raw data from Excel file (JSON)';
COMMENT ON COLUMN ratio_reports.created_by IS 'User who uploaded the ratio report';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ratio_reports TO erp_user;
GRANT USAGE, SELECT ON SEQUENCE ratio_reports_id_seq TO erp_user;

