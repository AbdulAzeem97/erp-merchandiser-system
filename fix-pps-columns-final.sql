-- Fix product_process_selections - Complete column synchronization and constraints

-- Step 1: Add snake_case columns if not exists
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT true;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS process_step_id INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS sequence_order INTEGER DEFAULT 0;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 0;

-- Step 2: Copy values if camelCase columns exist (sync both directions)
UPDATE product_process_selections 
SET is_selected = COALESCE("isSelected", true) 
WHERE is_selected IS NULL;

UPDATE product_process_selections 
SET process_step_id = "processStepId" 
WHERE process_step_id IS NULL AND "processStepId" IS NOT NULL;

UPDATE product_process_selections 
SET product_id = "productId" 
WHERE product_id IS NULL AND "productId" IS NOT NULL;

UPDATE product_process_selections 
SET "isSelected" = COALESCE(is_selected, true) 
WHERE "isSelected" IS NULL;

UPDATE product_process_selections 
SET "processStepId" = process_step_id 
WHERE "processStepId" IS NULL AND process_step_id IS NOT NULL;

UPDATE product_process_selections 
SET "productId" = product_id 
WHERE "productId" IS NULL AND product_id IS NOT NULL;

-- Step 3: Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pps_product_snake_fk') THEN
        ALTER TABLE product_process_selections 
        ADD CONSTRAINT pps_product_snake_fk 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pps_process_step_snake_fk') THEN
        ALTER TABLE product_process_selections 
        ADD CONSTRAINT pps_process_step_snake_fk 
        FOREIGN KEY (process_step_id) REFERENCES process_steps(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pps_product_snake ON product_process_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_pps_step_snake ON product_process_selections(process_step_id);
CREATE INDEX IF NOT EXISTS idx_pps_selected_snake ON product_process_selections(is_selected);
CREATE INDEX IF NOT EXISTS idx_pps_sequence ON product_process_selections(sequence_order);
CREATE INDEX IF NOT EXISTS idx_pps_product_selected ON product_process_selections(product_id, is_selected);

-- Step 5: Add unique constraint to prevent duplicate selections
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_pps_product_step_snake') THEN
        ALTER TABLE product_process_selections 
        ADD CONSTRAINT unique_pps_product_step_snake 
        UNIQUE (product_id, process_step_id);
    END IF;
END $$;

-- Step 6: Add trigger to sync columns automatically
CREATE OR REPLACE FUNCTION sync_pps_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync camelCase to snake_case
    NEW.product_id := NEW."productId";
    NEW.process_step_id := NEW."processStepId";
    NEW.is_selected := NEW."isSelected";
    
    -- Update timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_pps_trigger ON product_process_selections;
CREATE TRIGGER sync_pps_trigger
BEFORE INSERT OR UPDATE ON product_process_selections
FOR EACH ROW
EXECUTE FUNCTION sync_pps_columns();

-- Step 7: Verify changes
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    fk_count INTEGER;
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'product_process_selections'
    AND (column_name LIKE '%step%' OR column_name LIKE '%select%' OR column_name LIKE '%product%');
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'product_process_selections';
    
    SELECT COUNT(*) INTO fk_count
    FROM pg_constraint
    WHERE conrelid = 'product_process_selections'::regclass
    AND contype = 'f';
    
    SELECT COUNT(*) INTO row_count
    FROM product_process_selections;
    
    RAISE NOTICE 'Relevant columns in product_process_selections: %', column_count;
    RAISE NOTICE 'Indexes on product_process_selections: %', index_count;
    RAISE NOTICE 'Foreign keys on product_process_selections: %', fk_count;
    RAISE NOTICE 'Rows in product_process_selections: %', row_count;
END $$;

SELECT 'product_process_selections table fixed and enhanced successfully!' AS status;

-- Display sample data
SELECT id, product_id, process_step_id, is_selected, sequence_order 
FROM product_process_selections 
LIMIT 5;

