-- Migration: Set without_po flag for existing jobs without PO numbers
-- Description: Updates existing jobs that have empty/null PO numbers to mark them as without_po

UPDATE job_cards
SET without_po = true, po_required = false
WHERE (po_number IS NULL OR po_number = '') AND without_po = false;

