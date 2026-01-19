-- Migration: Add trigger to keep job_cards sequence in sync
-- Description: Creates a trigger that ensures job_cards_id_seq is always ahead of the max ID
-- This prevents duplicate key errors from occurring

-- Function to ensure sequence is always ahead of max ID
CREATE OR REPLACE FUNCTION ensure_job_cards_sequence()
RETURNS TRIGGER AS $$
DECLARE
    max_id INTEGER;
    current_seq_val INTEGER;
BEGIN
    -- Get current max ID
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM job_cards;
    
    -- Get current sequence value
    SELECT last_value INTO current_seq_val FROM job_cards_id_seq;
    
    -- If sequence is behind, advance it
    IF current_seq_val <= max_id THEN
        PERFORM setval('job_cards_id_seq', max_id + 1, false);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before INSERT
-- This ensures sequence is always ahead before any insert
DROP TRIGGER IF EXISTS trigger_ensure_job_cards_sequence ON job_cards;
CREATE TRIGGER trigger_ensure_job_cards_sequence
    BEFORE INSERT ON job_cards
    FOR EACH ROW
    EXECUTE FUNCTION ensure_job_cards_sequence();

COMMENT ON FUNCTION ensure_job_cards_sequence() IS 
'Ensures job_cards_id_seq is always ahead of the max ID to prevent duplicate key errors';

