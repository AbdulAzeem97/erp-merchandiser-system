-- Fix product_process_selections table for backend compatibility

-- Step 1: Add new columns if they don't exist
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS "processStepId" INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS "isSelected" BOOLEAN DEFAULT true;

-- Step 2: Migrate existing data if needed
-- Update isSelected to true for existing records where it's NULL
UPDATE product_process_selections 
SET "isSelected" = true 
WHERE "isSelected" IS NULL;

-- Step 3: Add foreign key constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_process_step_fk') THEN
        ALTER TABLE product_process_selections 
        ADD CONSTRAINT product_process_step_fk 
        FOREIGN KEY ("processStepId") REFERENCES process_steps(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pps_product_id ON product_process_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_pps_process_step_id ON product_process_selections("processStepId");
CREATE INDEX IF NOT EXISTS idx_pps_is_selected ON product_process_selections("isSelected");

-- Step 5: Add unique constraint to prevent duplicate selections
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_product_process_step') THEN
        ALTER TABLE product_process_selections 
        ADD CONSTRAINT unique_product_process_step 
        UNIQUE (product_id, "processStepId");
    END IF;
END $$;

-- Step 6: Verify the changes
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'product_process_selections'
    AND column_name IN ('processStepId', 'isSelected');
    
    -- Check indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'product_process_selections'
    AND indexname LIKE 'idx_pps_%';
    
    RAISE NOTICE 'Columns added: %', column_count;
    RAISE NOTICE 'Indexes created: %', index_count;
END $$;

SELECT 'product_process_selections table fixed successfully!' AS status;

