-- Check if tables already exist before creating new ones
-- This script ensures compatibility with existing schema

DO $$
BEGIN
    -- Check if tables already exist
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'companies'
    ) THEN
        RAISE NOTICE 'Existing schema detected - skipping table creation';
    ELSE
        RAISE NOTICE 'No existing schema found - will create tables';
    END IF;
END
$$;