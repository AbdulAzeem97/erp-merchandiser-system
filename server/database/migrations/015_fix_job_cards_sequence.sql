-- Migration: Fix job_cards sequence to prevent duplicate key errors
-- Description: Resets the job_cards_id_seq sequence to be in sync with the max ID in job_cards table
-- This migration is idempotent and safe to run multiple times

DO $$
DECLARE
    max_id INTEGER;
    current_seq_val INTEGER;
BEGIN
    -- Get the current max ID from job_cards table
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM job_cards;
    
    -- Get the current sequence value
    SELECT last_value INTO current_seq_val FROM job_cards_id_seq;
    
    -- Only update if sequence is behind
    IF current_seq_val < max_id THEN
        -- Reset sequence to max_id + 1
        PERFORM setval('job_cards_id_seq', max_id + 1, false);
        RAISE NOTICE 'Sequence updated: job_cards_id_seq reset from % to %', current_seq_val, max_id + 1;
    ELSE
        RAISE NOTICE 'Sequence is already in sync: current value %, max id %', current_seq_val, max_id;
    END IF;
END $$;

