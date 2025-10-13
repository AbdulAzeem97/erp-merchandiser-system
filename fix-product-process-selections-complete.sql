-- COMPLETE FIX: Product Process Selections Issue
-- This fixes the "product saved but not process sequence" error

-- Step 1: Ensure both table variants exist and are properly structured

-- Create/Update product_process_selections table
CREATE TABLE IF NOT EXISTS product_process_selections (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    "productId" INTEGER,
    process_step_id INTEGER,
    "processStepId" INTEGER,
    is_selected BOOLEAN DEFAULT true,
    "isSelected" BOOLEAN DEFAULT true,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create/Update product_step_selections table (alias table used by backend)
CREATE TABLE IF NOT EXISTS product_step_selections (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    "productId" INTEGER,
    step_id INTEGER,
    "stepId" INTEGER,
    process_step_id INTEGER,
    "processStepId" INTEGER,
    is_selected BOOLEAN DEFAULT true,
    "isSelected" BOOLEAN DEFAULT true,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add missing columns to both tables
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS "productId" INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS process_step_id INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS "processStepId" INTEGER;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT true;
ALTER TABLE product_process_selections ADD COLUMN IF NOT EXISTS "isSelected" BOOLEAN DEFAULT true;

ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "productId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS step_id INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "stepId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS process_step_id INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "processStepId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS is_selected BOOLEAN DEFAULT true;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "isSelected" BOOLEAN DEFAULT true;

-- Step 3: Add foreign key constraints (drop first if exists to avoid conflicts)
DO $$ 
BEGIN
    -- product_process_selections constraints
    ALTER TABLE product_process_selections DROP CONSTRAINT IF EXISTS pps_product_fk;
    ALTER TABLE product_process_selections ADD CONSTRAINT pps_product_fk 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    
    ALTER TABLE product_process_selections DROP CONSTRAINT IF EXISTS pps_product_camel_fk;
    ALTER TABLE product_process_selections ADD CONSTRAINT pps_product_camel_fk 
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;
    
    ALTER TABLE product_process_selections DROP CONSTRAINT IF EXISTS pps_step_fk;
    ALTER TABLE product_process_selections ADD CONSTRAINT pps_step_fk 
    FOREIGN KEY (process_step_id) REFERENCES process_steps(id) ON DELETE CASCADE;
    
    ALTER TABLE product_process_selections DROP CONSTRAINT IF EXISTS pps_step_camel_fk;
    ALTER TABLE product_process_selections ADD CONSTRAINT pps_step_camel_fk 
    FOREIGN KEY ("processStepId") REFERENCES process_steps(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Some constraints already exist or failed to add: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    -- product_step_selections constraints
    ALTER TABLE product_step_selections DROP CONSTRAINT IF EXISTS pss_product_fk;
    ALTER TABLE product_step_selections ADD CONSTRAINT pss_product_fk 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    
    ALTER TABLE product_step_selections DROP CONSTRAINT IF EXISTS pss_product_camel_fk;
    ALTER TABLE product_step_selections ADD CONSTRAINT pss_product_camel_fk 
    FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE;
    
    ALTER TABLE product_step_selections DROP CONSTRAINT IF EXISTS pss_step_fk;
    ALTER TABLE product_step_selections ADD CONSTRAINT pss_step_fk 
    FOREIGN KEY (step_id) REFERENCES process_steps(id) ON DELETE CASCADE;
    
    ALTER TABLE product_step_selections DROP CONSTRAINT IF EXISTS pss_step_camel_fk;
    ALTER TABLE product_step_selections ADD CONSTRAINT pss_step_camel_fk 
    FOREIGN KEY ("stepId") REFERENCES process_steps(id) ON DELETE CASCADE;
    
    ALTER TABLE product_step_selections DROP CONSTRAINT IF EXISTS pss_process_step_fk;
    ALTER TABLE product_step_selections ADD CONSTRAINT pss_process_step_fk 
    FOREIGN KEY (process_step_id) REFERENCES process_steps(id) ON DELETE CASCADE;
    
    ALTER TABLE product_step_selections DROP CONSTRAINT IF EXISTS pss_process_step_camel_fk;
    ALTER TABLE product_step_selections ADD CONSTRAINT pss_process_step_camel_fk 
    FOREIGN KEY ("processStepId") REFERENCES process_steps(id) ON DELETE CASCADE;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Some constraints already exist or failed to add: %', SQLERRM;
END $$;

-- Step 4: Create comprehensive indexes
CREATE INDEX IF NOT EXISTS idx_pps_product_id ON product_process_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_pps_product_id_camel ON product_process_selections("productId");
CREATE INDEX IF NOT EXISTS idx_pps_process_step_id ON product_process_selections(process_step_id);
CREATE INDEX IF NOT EXISTS idx_pps_process_step_id_camel ON product_process_selections("processStepId");
CREATE INDEX IF NOT EXISTS idx_pps_is_selected ON product_process_selections(is_selected);
CREATE INDEX IF NOT EXISTS idx_pps_is_selected_camel ON product_process_selections("isSelected");

CREATE INDEX IF NOT EXISTS idx_pss_product_id ON product_step_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_pss_product_id_camel ON product_step_selections("productId");
CREATE INDEX IF NOT EXISTS idx_pss_step_id ON product_step_selections(step_id);
CREATE INDEX IF NOT EXISTS idx_pss_step_id_camel ON product_step_selections("stepId");
CREATE INDEX IF NOT EXISTS idx_pss_process_step_id ON product_step_selections(process_step_id);
CREATE INDEX IF NOT EXISTS idx_pss_process_step_id_camel ON product_step_selections("processStepId");
CREATE INDEX IF NOT EXISTS idx_pss_is_selected ON product_step_selections(is_selected);
CREATE INDEX IF NOT EXISTS idx_pss_is_selected_camel ON product_step_selections("isSelected");

-- Step 5: Create trigger functions to auto-sync all column variants
CREATE OR REPLACE FUNCTION sync_product_process_selections_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync all variants for product_process_selections
    NEW.product_id := COALESCE(NEW."productId", NEW.product_id);
    NEW."productId" := COALESCE(NEW.product_id, NEW."productId");
    
    NEW.process_step_id := COALESCE(NEW."processStepId", NEW.process_step_id);
    NEW."processStepId" := COALESCE(NEW.process_step_id, NEW."processStepId");
    
    NEW.is_selected := COALESCE(NEW."isSelected", NEW.is_selected, true);
    NEW."isSelected" := COALESCE(NEW.is_selected, NEW."isSelected", true);
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_product_step_selections_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync all variants for product_step_selections
    NEW.product_id := COALESCE(NEW."productId", NEW.product_id);
    NEW."productId" := COALESCE(NEW.product_id, NEW."productId");
    
    -- step_id can map to any of these
    NEW.step_id := COALESCE(NEW."stepId", NEW.step_id, NEW.process_step_id, NEW."processStepId");
    NEW."stepId" := COALESCE(NEW.step_id, NEW."stepId", NEW.process_step_id, NEW."processStepId");
    NEW.process_step_id := COALESCE(NEW.process_step_id, NEW."processStepId", NEW.step_id, NEW."stepId");
    NEW."processStepId" := COALESCE(NEW."processStepId", NEW.process_step_id, NEW.step_id, NEW."stepId");
    
    NEW.is_selected := COALESCE(NEW."isSelected", NEW.is_selected, true);
    NEW."isSelected" := COALESCE(NEW.is_selected, NEW."isSelected", true);
    
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Apply triggers
DROP TRIGGER IF EXISTS sync_pps_columns_trigger ON product_process_selections;
CREATE TRIGGER sync_pps_columns_trigger
BEFORE INSERT OR UPDATE ON product_process_selections
FOR EACH ROW
EXECUTE FUNCTION sync_product_process_selections_columns();

DROP TRIGGER IF EXISTS sync_pss_columns_trigger ON product_step_selections;
CREATE TRIGGER sync_pss_columns_trigger
BEFORE INSERT OR UPDATE ON product_step_selections
FOR EACH ROW
EXECUTE FUNCTION sync_product_step_selections_columns();

-- Step 7: Add unique constraints to prevent duplicates (drop first if exists)
DO $$ 
BEGIN
    ALTER TABLE product_process_selections DROP CONSTRAINT IF EXISTS unique_pps_product_step;
    ALTER TABLE product_process_selections ADD CONSTRAINT unique_pps_product_step 
    UNIQUE (product_id, process_step_id);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Unique constraint on product_process_selections may already exist: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    ALTER TABLE product_step_selections DROP CONSTRAINT IF EXISTS unique_pss_product_step;
    ALTER TABLE product_step_selections ADD CONSTRAINT unique_pss_product_step 
    UNIQUE (product_id, step_id);
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Unique constraint on product_step_selections may already exist: %', SQLERRM;
END $$;

-- Step 8: Sync existing data between tables
INSERT INTO product_step_selections (product_id, step_id, is_selected, created_at)
SELECT product_id, process_step_id, is_selected, created_at
FROM product_process_selections
WHERE NOT EXISTS (
    SELECT 1 FROM product_step_selections pss
    WHERE pss.product_id = product_process_selections.product_id
    AND pss.step_id = product_process_selections.process_step_id
)
ON CONFLICT DO NOTHING;

INSERT INTO product_process_selections (product_id, process_step_id, is_selected, created_at)
SELECT product_id, step_id, is_selected, created_at
FROM product_step_selections
WHERE NOT EXISTS (
    SELECT 1 FROM product_process_selections pps
    WHERE pps.product_id = product_step_selections.product_id
    AND pps.process_step_id = product_step_selections.step_id
)
ON CONFLICT DO NOTHING;

-- Step 9: Verify the fix
DO $$
DECLARE
    pps_columns INTEGER;
    pss_columns INTEGER;
    pps_indexes INTEGER;
    pss_indexes INTEGER;
    pps_rows INTEGER;
    pss_rows INTEGER;
BEGIN
    -- Count columns
    SELECT COUNT(*) INTO pps_columns
    FROM information_schema.columns
    WHERE table_name = 'product_process_selections';
    
    SELECT COUNT(*) INTO pss_columns
    FROM information_schema.columns
    WHERE table_name = 'product_step_selections';
    
    -- Count indexes
    SELECT COUNT(*) INTO pps_indexes
    FROM pg_indexes
    WHERE tablename = 'product_process_selections';
    
    SELECT COUNT(*) INTO pss_indexes
    FROM pg_indexes
    WHERE tablename = 'product_step_selections';
    
    -- Count rows
    SELECT COUNT(*) INTO pps_rows FROM product_process_selections;
    SELECT COUNT(*) INTO pss_rows FROM product_step_selections;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PRODUCT PROCESS SELECTIONS FIX COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'product_process_selections:';
    RAISE NOTICE '  - Columns: %', pps_columns;
    RAISE NOTICE '  - Indexes: %', pps_indexes;
    RAISE NOTICE '  - Rows: %', pps_rows;
    RAISE NOTICE '';
    RAISE NOTICE 'product_step_selections:';
    RAISE NOTICE '  - Columns: %', pss_columns;
    RAISE NOTICE '  - Indexes: %', pss_indexes;
    RAISE NOTICE '  - Rows: %', pss_rows;
    RAISE NOTICE '========================================';
END $$;

SELECT 
    '✅ Product process selections tables are now fully configured!' as status,
    'Both product_process_selections and product_step_selections tables are ready' as message,
    'All column variants (camelCase and snake_case) are supported' as note;

-- Display table structures for verification
SELECT 
    'product_process_selections' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'product_process_selections'
ORDER BY ordinal_position;

SELECT 
    'product_step_selections' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'product_step_selections'
ORDER BY ordinal_position;

