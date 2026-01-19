-- Migration: Fix products sequence to prevent duplicate key errors
-- Description: Resets the products_id_seq sequence to be in sync with the max ID in products table
-- This migration is idempotent and safe to run multiple times

DO $$
DECLARE
    max_id INTEGER;
    current_seq_val INTEGER;
BEGIN
    -- Get the current max ID from products table
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM products;
    
    -- Get the current sequence value
    SELECT last_value INTO current_seq_val FROM products_id_seq;
    
    -- Only update if sequence is behind
    IF current_seq_val < max_id THEN
        -- Reset sequence to max_id + 1
        PERFORM setval('products_id_seq', max_id + 1, false);
        RAISE NOTICE 'Sequence updated: products_id_seq reset from % to %', current_seq_val, max_id + 1;
    ELSE
        RAISE NOTICE 'Sequence is already in sync: current value %, max id %', current_seq_val, max_id;
    END IF;
END $$;

