-- Migration: Set Default Offset Process Sequence for All Products
-- Version: 004
-- Description: Ensures Offset sequence includes Design, QA Prepress, and CTP as compulsory, and sets it as default for all products

-- First, ensure Offset process sequence exists with correct steps
DO $$
DECLARE
    offset_sequence_id INTEGER;
    step_id INTEGER;
BEGIN
    -- Get or create Offset sequence
    SELECT id INTO offset_sequence_id
    FROM process_sequences
    WHERE name = 'Offset' OR name LIKE 'Offset%'
    LIMIT 1;

    IF offset_sequence_id IS NULL THEN
        -- Create Offset sequence if it doesn't exist
        INSERT INTO process_sequences (name, description, "isActive")
        VALUES ('Offset', 'Standard offset printing process with Prepress (Design, QA, CTP)', true)
        RETURNING id INTO offset_sequence_id;
    END IF;

    -- Delete existing steps for Offset to recreate with correct order
    DELETE FROM process_steps WHERE "sequenceId" = offset_sequence_id;

    -- Insert Prepress steps (compulsory)
    -- Step 1: Design
    INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
    VALUES (offset_sequence_id, 1, 'Design', 'Design creation and review', false, true)
    RETURNING id INTO step_id;

    -- Step 2: QA Review (Prepress)
    INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
    VALUES (offset_sequence_id, 2, 'QA Review (Prepress)', 'Quality assurance review for prepress design', true, true)
    RETURNING id INTO step_id;

    -- Step 3: CTP (Plate Making)
    INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
    VALUES (offset_sequence_id, 3, 'CTP', 'Computer-to-Plate - Plate making', false, true)
    RETURNING id INTO step_id;

    -- Step 4: Plate Making (alternative name, also compulsory)
    INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
    VALUES (offset_sequence_id, 4, 'Plate Making', 'Physical plate creation', false, true)
    RETURNING id INTO step_id;

    -- Continue with other production steps (optional)
    INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive")
    VALUES 
        (offset_sequence_id, 5, 'Printing', 'Main printing process', false, true),
        (offset_sequence_id, 6, 'Cutting', 'Material cutting', false, true),
        (offset_sequence_id, 7, 'Final QA', 'Final quality assurance', true, true),
        (offset_sequence_id, 8, 'Dispatch', 'Shipping and dispatch', false, true);

    RAISE NOTICE 'Offset sequence created/updated with ID: %', offset_sequence_id;
END $$;

-- Set Offset sequence as default for all products that don't have a sequence
DO $$
DECLARE
    offset_sequence_id INTEGER;
    product_record RECORD;
BEGIN
    -- Get Offset sequence ID
    SELECT id INTO offset_sequence_id
    FROM process_sequences
    WHERE name = 'Offset' OR name LIKE 'Offset%'
    LIMIT 1;

    IF offset_sequence_id IS NULL THEN
        RAISE EXCEPTION 'Offset sequence not found. Please run the sequence creation part first.';
    END IF;

    -- For each product without a default sequence, set Offset as default
    FOR product_record IN 
        SELECT p.id as product_id
        FROM products p
        WHERE NOT EXISTS (
            SELECT 1 
            FROM product_process_selections pps
            WHERE pps."productId" = p.id AND pps."isDefault" = true
        )
    LOOP
        -- Insert default sequence selection for this product
        INSERT INTO product_process_selections ("productId", "sequenceId", "isDefault", "createdAt")
        VALUES (product_record.product_id, offset_sequence_id, true, CURRENT_TIMESTAMP)
        ON CONFLICT ("productId", "sequenceId") DO UPDATE SET "isDefault" = true;

        RAISE NOTICE 'Set Offset as default for product ID: %', product_record.product_id;
    END LOOP;

    RAISE NOTICE 'Default Offset sequence set for all products';
END $$;

SELECT 'Default Offset sequence configured successfully!' as message;

