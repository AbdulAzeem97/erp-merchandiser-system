-- Migration: Fix all sequences that are out of sync
-- Description: Automatically fixes all sequences that are currently behind their table's max ID
-- This is a one-time fix for all existing sequence issues

-- Fix all sequences that are out of sync
DO $$
DECLARE
    seq_rec RECORD;
    tbl_name TEXT;
    max_id INTEGER;
    current_seq_val INTEGER;
    sql_query TEXT;
BEGIN
    FOR seq_rec IN 
        SELECT sequencename
        FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename LIKE '%_id_seq'
    LOOP
        -- Extract table name from sequence name
        tbl_name := replace(seq_rec.sequencename, '_id_seq', '');
        
        -- Check if table exists
        IF EXISTS (
            SELECT 1 FROM information_schema.tables t
            WHERE t.table_schema = 'public' AND t.table_name = tbl_name
        ) THEN
            BEGIN
                -- Get max ID
                sql_query := format('SELECT COALESCE(MAX(id), 0) FROM %I', tbl_name);
                EXECUTE sql_query INTO max_id;
                
                -- Get current sequence value
                sql_query := format('SELECT last_value FROM %I', seq_rec.sequencename);
                EXECUTE sql_query INTO current_seq_val;
                
                -- Fix if needed
                IF current_seq_val < max_id THEN
                    sql_query := format('SELECT setval(%L, %s, false)', seq_rec.sequencename, max_id + 1);
                    EXECUTE sql_query;
                    RAISE NOTICE 'Fixed sequence %: reset from % to %', seq_rec.sequencename, current_seq_val, max_id + 1;
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Skip tables that don't have an id column or have errors
                    RAISE NOTICE 'Skipped sequence %: %', seq_rec.sequencename, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

