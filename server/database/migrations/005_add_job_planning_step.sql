-- Migration: Add Job Planning Step to Process Sequence
-- Version: 005
-- Description: Adds Job Planning step after CTP in the Offset process sequence

DO $$
DECLARE
    offset_sequence_id INTEGER;
    step_id INTEGER;
BEGIN
    -- Get Offset sequence ID
    SELECT id INTO offset_sequence_id
    FROM process_sequences
    WHERE name = 'Offset' OR name LIKE 'Offset%'
    LIMIT 1;

    IF offset_sequence_id IS NULL THEN
        RAISE EXCEPTION 'Offset sequence not found. Please run migration 004 first.';
    END IF;

    -- Check if Job Planning step already exists
    IF NOT EXISTS (
        SELECT 1 FROM process_steps 
        WHERE "sequenceId" = offset_sequence_id 
        AND name = 'Job Planning'
    ) THEN
        -- Get the current step numbers to shift them
        -- First, shift all steps after CTP (step 3) by 1, starting from the highest step number to avoid unique constraint violations
        UPDATE process_steps
        SET "stepNumber" = "stepNumber" + 1000
        WHERE "sequenceId" = offset_sequence_id
        AND "stepNumber" > 3;

        -- Now shift them back by 999 to get the correct new numbers
        UPDATE process_steps
        SET "stepNumber" = "stepNumber" - 999
        WHERE "sequenceId" = offset_sequence_id
        AND "stepNumber" > 1000;

        -- Insert Job Planning as step 4 (after CTP)
        INSERT INTO process_steps ("sequenceId", "stepNumber", name, description, "isQualityCheck", "isActive", "createdAt", "updatedAt")
        VALUES (offset_sequence_id, 4, 'Job Planning', 'Smart production planning and sheet optimization', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id INTO step_id;

        RAISE NOTICE 'Job Planning step added as step 4 to Offset sequence';
    ELSE
        RAISE NOTICE 'Job Planning step already exists in Offset sequence';
    END IF;

END $$;

-- Verify the step order
SELECT 
    ps.name as sequence_name,
    pst."stepNumber",
    pst.name as step_name,
    pst."isQualityCheck" as is_compulsory,
    pst."isActive"
FROM process_sequences ps
JOIN process_steps pst ON ps.id = pst."sequenceId"
WHERE ps.name = 'Offset' OR ps.name LIKE 'Offset%'
ORDER BY pst."stepNumber";

SELECT 'Job Planning step added successfully!' as message;

