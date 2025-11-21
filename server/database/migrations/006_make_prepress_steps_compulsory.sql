-- Migration: Make Prepress Steps Compulsory
-- Version: 006
-- Description: Marks Design, QA Review, and CTP as compulsory steps in the Offset process sequence

DO $$
DECLARE
    offset_sequence_id INTEGER;
BEGIN
    -- Get Offset sequence ID
    SELECT id INTO offset_sequence_id
    FROM process_sequences
    WHERE name = 'Offset' OR name LIKE 'Offset%'
    LIMIT 1;

    IF offset_sequence_id IS NULL THEN
        RAISE EXCEPTION 'Offset sequence not found. Please run migration 004 first.';
    END IF;

    -- Mark Design (step 1) as compulsory (isQualityCheck = true)
    UPDATE process_steps
    SET "isQualityCheck" = true
    WHERE "sequenceId" = offset_sequence_id
    AND name = 'Design'
    AND "stepNumber" = 1;

    -- Mark QA Review (Prepress) (step 2) as compulsory (already should be true, but ensure it)
    UPDATE process_steps
    SET "isQualityCheck" = true
    WHERE "sequenceId" = offset_sequence_id
    AND name = 'QA Review (Prepress)'
    AND "stepNumber" = 2;

    -- Mark CTP (step 3) as compulsory (isQualityCheck = true)
    UPDATE process_steps
    SET "isQualityCheck" = true
    WHERE "sequenceId" = offset_sequence_id
    AND name = 'CTP'
    AND "stepNumber" = 3;

    RAISE NOTICE 'Prepress steps (Design, QA Review, CTP) marked as compulsory';

END $$;

-- Verify the compulsory steps
SELECT 
    ps.name as sequence_name,
    pst."stepNumber",
    pst.name as step_name,
    pst."isQualityCheck" as is_compulsory,
    pst."isActive"
FROM process_sequences ps
JOIN process_steps pst ON ps.id = pst."sequenceId"
WHERE ps.name = 'Offset' OR ps.name LIKE 'Offset%'
AND pst."stepNumber" <= 3
ORDER BY pst."stepNumber";

SELECT 'Prepress steps marked as compulsory successfully!' as message;

