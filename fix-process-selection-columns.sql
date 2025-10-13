-- Fix product_step_selections table for complete camelCase compatibility

-- Step 1: Ensure table exists
CREATE TABLE IF NOT EXISTS product_step_selections (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    process_step_id INTEGER,
    is_selected BOOLEAN DEFAULT true,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add camelCase alias columns
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "productId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "processStepId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "stepId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "isSelected" BOOLEAN DEFAULT true;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "sequenceOrder" INTEGER DEFAULT 0;

-- Step 3: Update values from snake_case columns (sync both directions)
UPDATE product_step_selections SET "productId" = product_id WHERE "productId" IS NULL AND product_id IS NOT NULL;
UPDATE product_step_selections SET "processStepId" = process_step_id WHERE "processStepId" IS NULL AND process_step_id IS NOT NULL;
UPDATE product_step_selections SET "stepId" = process_step_id WHERE "stepId" IS NULL AND process_step_id IS NOT NULL;
UPDATE product_step_selections SET "isSelected" = is_selected WHERE "isSelected" IS NULL AND is_selected IS NOT NULL;
UPDATE product_step_selections SET "sequenceOrder" = sequence_order WHERE "sequenceOrder" IS NULL AND sequence_order IS NOT NULL;

UPDATE product_step_selections SET product_id = "productId" WHERE product_id IS NULL AND "productId" IS NOT NULL;
UPDATE product_step_selections SET process_step_id = "processStepId" WHERE process_step_id IS NULL AND "processStepId" IS NOT NULL;
UPDATE product_step_selections SET is_selected = "isSelected" WHERE is_selected IS NULL AND "isSelected" IS NOT NULL;
UPDATE product_step_selections SET sequence_order = "sequenceOrder" WHERE sequence_order IS NULL AND "sequenceOrder" IS NOT NULL;

-- Step 4: Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pss_product_fk') THEN
        ALTER TABLE product_step_selections 
        ADD CONSTRAINT pss_product_fk 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pss_process_step_fk') THEN
        ALTER TABLE product_step_selections 
        ADD CONSTRAINT pss_process_step_fk 
        FOREIGN KEY (process_step_id) REFERENCES process_steps(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pss_product_id ON product_step_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_pss_product_id_camel ON product_step_selections("productId");
CREATE INDEX IF NOT EXISTS idx_pss_step_id ON product_step_selections(process_step_id);
CREATE INDEX IF NOT EXISTS idx_pss_step_id_camel ON product_step_selections("processStepId");
CREATE INDEX IF NOT EXISTS idx_pss_selected ON product_step_selections(is_selected);
CREATE INDEX IF NOT EXISTS idx_pss_sequence ON product_step_selections(sequence_order);

-- Step 6: Add unique constraint to prevent duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_pss_product_step') THEN
        ALTER TABLE product_step_selections 
        ADD CONSTRAINT unique_pss_product_step 
        UNIQUE (product_id, process_step_id);
    END IF;
END $$;

-- Step 7: Add trigger to sync columns automatically
CREATE OR REPLACE FUNCTION sync_pss_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.product_id := NEW."productId";
    NEW.process_step_id := NEW."processStepId";
    NEW.is_selected := NEW."isSelected";
    NEW.sequence_order := NEW."sequenceOrder";
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_pss_trigger ON product_step_selections;
CREATE TRIGGER sync_pss_trigger
BEFORE INSERT OR UPDATE ON product_step_selections
FOR EACH ROW
EXECUTE FUNCTION sync_pss_columns();

-- Step 8: Add missing columns to job_cards
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS client_layout_link TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "clientLayoutLink" TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS final_design_link TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "finalDesignLink" TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS artwork_link TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "artworkLink" TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS approved_artwork_link TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "approvedArtworkLink" TEXT;

-- Step 9: Sync job_cards link columns
UPDATE job_cards SET "clientLayoutLink" = client_layout_link WHERE "clientLayoutLink" IS NULL AND client_layout_link IS NOT NULL;
UPDATE job_cards SET "finalDesignLink" = final_design_link WHERE "finalDesignLink" IS NULL AND final_design_link IS NOT NULL;
UPDATE job_cards SET "artworkLink" = artwork_link WHERE "artworkLink" IS NULL AND artwork_link IS NOT NULL;
UPDATE job_cards SET "approvedArtworkLink" = approved_artwork_link WHERE "approvedArtworkLink" IS NULL AND approved_artwork_link IS NOT NULL;

-- Step 10: Create indexes for job_cards link columns
CREATE INDEX IF NOT EXISTS idx_job_cards_client_layout ON job_cards("clientLayoutLink");
CREATE INDEX IF NOT EXISTS idx_job_cards_final_design ON job_cards("finalDesignLink");
CREATE INDEX IF NOT EXISTS idx_job_cards_artwork ON job_cards("artworkLink");

-- Step 11: Verify changes
DO $$
DECLARE
    pss_column_count INTEGER;
    pss_index_count INTEGER;
    jc_column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pss_column_count
    FROM information_schema.columns
    WHERE table_name = 'product_step_selections';
    
    SELECT COUNT(*) INTO pss_index_count
    FROM pg_indexes
    WHERE tablename = 'product_step_selections';
    
    SELECT COUNT(*) INTO jc_column_count
    FROM information_schema.columns
    WHERE table_name = 'job_cards'
    AND column_name LIKE '%link%';
    
    RAISE NOTICE 'Columns in product_step_selections: %', pss_column_count;
    RAISE NOTICE 'Indexes on product_step_selections: %', pss_index_count;
    RAISE NOTICE 'Link columns in job_cards: %', jc_column_count;
END $$;

SELECT 'All process selection and job card columns fixed and enhanced successfully!' AS status;

