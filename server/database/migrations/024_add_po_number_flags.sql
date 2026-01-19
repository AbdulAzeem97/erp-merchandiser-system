-- Migration: Add PO number status tracking columns
-- Description: Adds columns to track whether jobs were created without PO numbers
-- and when PO numbers were provided/updated

-- Add columns to track PO number status
ALTER TABLE job_cards
  ADD COLUMN IF NOT EXISTS without_po BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS po_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS po_provided_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS po_updated_by INTEGER REFERENCES users(id);

-- Create index for filtering jobs without PO
CREATE INDEX IF NOT EXISTS idx_job_cards_without_po ON job_cards(without_po) WHERE without_po = true;

COMMENT ON COLUMN job_cards.without_po IS 'Indicates if job was created without PO number';
COMMENT ON COLUMN job_cards.po_required IS 'Indicates if PO number is required for this job';
COMMENT ON COLUMN job_cards.po_provided_at IS 'Timestamp when PO number was first provided';
COMMENT ON COLUMN job_cards.po_updated_by IS 'User who last updated the PO number';

-- Migrate existing jobs: set without_po=true for jobs with empty/null po_number
UPDATE job_cards
SET without_po = true, po_required = false
WHERE (po_number IS NULL OR po_number = '') AND without_po = false;

