-- Create item_specifications table for storing item details from Excel uploads
CREATE TABLE IF NOT EXISTS item_specifications (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER REFERENCES job_cards(id),
  excel_file_link TEXT NOT NULL,
  excel_file_name TEXT,
  po_number TEXT,
  job_number TEXT,
  brand_name TEXT,
  item_name TEXT,
  uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  item_count INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  size_variants INTEGER DEFAULT 0,
  color_variants INTEGER DEFAULT 0,
  specifications JSONB,
  raw_excel_data JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_specifications_job_card_id ON item_specifications(job_card_id);
CREATE INDEX IF NOT EXISTS idx_item_specifications_po_number ON item_specifications(po_number);
CREATE INDEX IF NOT EXISTS idx_item_specifications_job_number ON item_specifications(job_number);
CREATE INDEX IF NOT EXISTS idx_item_specifications_uploaded_at ON item_specifications(uploaded_at);

-- Add comments for documentation
COMMENT ON TABLE item_specifications IS 'Stores item specifications data uploaded via Excel files for all jobs';
COMMENT ON COLUMN item_specifications.excel_file_link IS 'Google Drive link to the uploaded Excel file';
COMMENT ON COLUMN item_specifications.specifications IS 'Parsed specifications data (sizes, colors, materials, etc.)';
COMMENT ON COLUMN item_specifications.raw_excel_data IS 'Complete raw data from Excel file for reference';
