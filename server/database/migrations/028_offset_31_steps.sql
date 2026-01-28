-- Migration: Ensure Complete 31-Step Offset Process Sequence
-- Version: 028
-- Description: Creates/updates Offset process sequence with exactly 31 steps matching frontend processSequences.ts

DO $$
DECLARE
    offset_sequence_id INTEGER;
    step_order INTEGER;
    step_name TEXT;
    step_description TEXT;
    is_compulsory BOOLEAN;
    step_id INTEGER;
BEGIN
    -- Get or create Offset sequence
    SELECT id INTO offset_sequence_id
    FROM process_sequences
    WHERE name = 'Offset' OR name LIKE 'Offset%' OR product_type = 'Offset'
    LIMIT 1;

    IF offset_sequence_id IS NULL THEN
        -- Create Offset sequence if it doesn't exist
        INSERT INTO process_sequences (name, description, is_active, product_type)
        VALUES ('Offset', 'Complete 31-step offset printing process workflow', true, 'Offset')
        RETURNING id INTO offset_sequence_id;
    ELSE
        -- Update existing sequence
        UPDATE process_sequences
        SET description = 'Complete 31-step offset printing process workflow',
            is_active = true
        WHERE id = offset_sequence_id;
    END IF;

    -- Define all 31 steps in order (matching src/data/processSequences.ts)
    -- Format: (step_order, step_name, step_description, is_compulsory)
    CREATE TEMP TABLE IF NOT EXISTS offset_steps_temp (
        step_order INTEGER,
        step_name TEXT,
        step_description TEXT,
        is_compulsory BOOLEAN
    );

    -- Clear temp table
    DELETE FROM offset_steps_temp;

    -- Insert all 31 steps
    INSERT INTO offset_steps_temp (step_order, step_name, step_description, is_compulsory) VALUES
        (1, 'Prepress', 'Prepress preparation including design, QA, and CTP', true),
        (2, 'Material Procurment', 'Material procurement and sourcing', true),
        (3, 'Material Issuance', 'Material issuance to production', true),
        (4, 'Paper Cutting', 'Paper cutting and trimming', false),
        (5, 'Offset Printing', 'Offset printing process', false),
        (6, 'Digital Printing', 'Digital printing process', false),
        (7, 'Varnish Matt', 'Matte varnish application', false),
        (8, 'Varnish Gloss', 'Gloss varnish application', false),
        (9, 'Varnish Soft Touch', 'Soft touch varnish application', false),
        (10, 'Inlay Pasting', 'Inlay pasting process', false),
        (11, 'Lamination Matte', 'Matte lamination', false),
        (12, 'Lamination Gloss', 'Gloss lamination', false),
        (13, 'Lamination Soft Touch', 'Soft touch lamination', false),
        (14, 'UV', 'UV coating application', false),
        (15, 'Foil Matte', 'Matte foil stamping', false),
        (16, 'Foil Gloss', 'Gloss foil stamping', false),
        (17, 'Screen Printing', 'Screen printing process', false),
        (18, 'Embossing', 'Embossing process', false),
        (19, 'Debossing', 'Debossing process', false),
        (20, 'Pasting', 'Pasting process', false),
        (21, 'Two way tape', 'Two way tape application', false),
        (22, 'Die Cutting', 'Die cutting process', false),
        (23, 'Breaking', 'Breaking process', false),
        (24, 'Piggy Sticker', 'Piggy sticker application', false),
        (25, 'RFID', 'RFID tag application', false),
        (26, 'Eyelet', 'Eyelet application', false),
        (27, 'Out Source', 'Outsourced operations', false),
        (28, 'Packing', 'Packing process', false),
        (29, 'Ready', 'Ready for dispatch', false),
        (30, 'Dispatch', 'Dispatch and shipping', false),
        (31, 'Excess', 'Excess material handling', false);

    -- Upsert each step
    FOR step_order, step_name, step_description, is_compulsory IN
        SELECT step_order, step_name, step_description, is_compulsory
        FROM offset_steps_temp
        ORDER BY step_order
    LOOP
        -- Check if step already exists
        SELECT id INTO step_id
        FROM process_steps
        WHERE sequence_id = offset_sequence_id
          AND step_number = step_order;

        IF step_id IS NULL THEN
            -- Insert new step
            INSERT INTO process_steps (
                sequence_id,
                step_number,
                name,
                description,
                is_quality_check,
                is_active,
                created_at,
                updated_at
            )
            VALUES (
                offset_sequence_id,
                step_order,
                step_name,
                step_description,
                false, -- isQualityCheck (only Ready step might need QA, but it's handled separately)
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        ELSE
            -- Update existing step
            UPDATE process_steps
            SET
                name = step_name,
                description = step_description,
                is_active = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = step_id;
        END IF;
    END LOOP;

    -- Delete any steps that are not in our 31-step list (cleanup)
    DELETE FROM process_steps
    WHERE sequence_id = offset_sequence_id
      AND step_number > 31;

    -- Clean up temp table
    DROP TABLE IF EXISTS offset_steps_temp;

    RAISE NOTICE 'Offset sequence updated with 31 steps. Sequence ID: %', offset_sequence_id;
END $$;

-- Verify the steps
SELECT 
    ps.name as sequence_name,
    pst.step_number as step_order,
    pst.name as step_name,
    pst.description,
    pst.is_active,
    COUNT(*) OVER () as total_steps
FROM process_sequences ps
JOIN process_steps pst ON ps.id = pst.sequence_id
WHERE (ps.name = 'Offset' OR ps.name LIKE 'Offset%' OR ps.product_type = 'Offset')
  AND ps.is_active = true
ORDER BY pst.step_number ASC;

SELECT 'Offset 31-step sequence migration completed successfully!' as message;
