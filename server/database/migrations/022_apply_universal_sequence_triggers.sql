-- Migration: Apply universal sequence triggers to all tables
-- Description: Dynamically creates triggers for all tables with SERIAL primary keys
-- This ensures ALL tables are protected from sequence issues automatically

-- Apply universal sequence trigger to all tables with SERIAL primary keys
DO $$
DECLARE
    table_rec RECORD;
    trigger_name TEXT;
BEGIN
    -- Loop through all sequences and create triggers
    FOR table_rec IN 
        SELECT 
            replace(sequencename, '_id_seq', '') as table_name,
            sequencename
        FROM pg_sequences 
        WHERE schemaname = 'public' 
        AND sequencename LIKE '%_id_seq'
    LOOP
        -- Check if table exists and has id column
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name
            WHERE t.table_schema = 'public' 
            AND t.table_name = table_rec.table_name
            AND c.column_name = 'id'
            AND c.data_type = 'integer'
        ) THEN
            trigger_name := 'trigger_ensure_sequence_' || table_rec.table_name;
            
            -- Drop existing trigger if exists
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, table_rec.table_name);
            
            -- Create new trigger
            EXECUTE format(
                'CREATE TRIGGER %I BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION ensure_sequence_sync()',
                trigger_name,
                table_rec.table_name
            );
            
            RAISE NOTICE 'Created trigger % for table %', trigger_name, table_rec.table_name;
        END IF;
    END LOOP;
END $$;

