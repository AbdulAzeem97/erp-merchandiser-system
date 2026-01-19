-- Create pdf_annotations table to store PDF annotations
CREATE TABLE IF NOT EXISTS pdf_annotations (
  id SERIAL PRIMARY KEY,
  job_card_id INTEGER NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  annotations JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_job_card_id ON pdf_annotations(job_card_id);
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_pdf_url ON pdf_annotations(pdf_url);
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_created_at ON pdf_annotations(created_at);

-- Add comments for documentation
COMMENT ON TABLE pdf_annotations IS 'Stores PDF annotations (tick/cross marks) for final layout PDFs';
COMMENT ON COLUMN pdf_annotations.job_card_id IS 'Reference to the job card';
COMMENT ON COLUMN pdf_annotations.pdf_url IS 'URL of the PDF file being annotated';
COMMENT ON COLUMN pdf_annotations.annotations IS 'Array of annotation objects (JSON)';
COMMENT ON COLUMN pdf_annotations.created_by IS 'User who created the annotations';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON pdf_annotations TO erp_user;
GRANT USAGE, SELECT ON SEQUENCE pdf_annotations_id_seq TO erp_user;

