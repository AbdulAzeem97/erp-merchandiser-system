-- Migration: Create universal sequence sync functions
-- Description: Creates universal functions that work for ANY table with SERIAL primary key
-- This provides a single solution for all sequence synchronization needs

-- Universal function to sync ANY sequence with its table's max ID
CREATE OR REPLACE FUNCTION sync_sequence_with_table(
    table_name TEXT,
    sequence_name TEXT
)
RETURNS VOID AS $$
DECLARE
    max_id INTEGER;
    current_seq_val INTEGER;
    sql_query TEXT;
BEGIN
    -- Get current max ID from table
    sql_query := format('SELECT COALESCE(MAX(id), 0) FROM %I', table_name);
    EXECUTE sql_query INTO max_id;
    
    -- Get current sequence value
    sql_query := format('SELECT last_value FROM %I', sequence_name);
    EXECUTE sql_query INTO current_seq_val;
    
    -- If sequence is behind, advance it
    IF current_seq_val <= max_id THEN
        sql_query := format('SELECT setval(%L, %s, false)', sequence_name, max_id + 1);
        EXECUTE sql_query;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Universal trigger function that works for any table
CREATE OR REPLACE FUNCTION ensure_sequence_sync()
RETURNS TRIGGER AS $$
DECLARE
    table_name TEXT;
    sequence_name TEXT;
    max_id INTEGER;
    current_seq_val INTEGER;
    sql_query TEXT;
BEGIN
    -- Get table name from TG_TABLE_NAME
    table_name := TG_TABLE_NAME;
    
    -- Construct sequence name (table_name + '_id_seq')
    sequence_name := table_name || '_id_seq';
    
    -- Get current max ID
    sql_query := format('SELECT COALESCE(MAX(id), 0) FROM %I', table_name);
    EXECUTE sql_query INTO max_id;
    
    -- Get current sequence value
    sql_query := format('SELECT last_value FROM %I', sequence_name);
    EXECUTE sql_query INTO current_seq_val;
    
    -- If sequence is behind, advance it
    IF current_seq_val <= max_id THEN
        sql_query := format('SELECT setval(%L, %s, false)', sequence_name, max_id + 1);
        EXECUTE sql_query;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ensure_sequence_sync() IS 
'Universal trigger function that ensures any table''s sequence is always ahead of max ID';

COMMENT ON FUNCTION sync_sequence_with_table(TEXT, TEXT) IS 
'Universal function to manually sync any sequence with its table''s max ID';

