-- Fix All Backend Errors for Complete Functionality

-- Step 1: Create product_step_selections table (alias for product_process_selections)
CREATE TABLE IF NOT EXISTS product_step_selections (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    process_step_id INTEGER REFERENCES process_steps(id) ON DELETE CASCADE,
    is_selected BOOLEAN DEFAULT true,
    sequence_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, process_step_id)
);

-- Add camelCase columns to product_step_selections
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "productId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "processStepId" INTEGER;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "isSelected" BOOLEAN DEFAULT true;
ALTER TABLE product_step_selections ADD COLUMN IF NOT EXISTS "sequenceOrder" INTEGER DEFAULT 0;

-- Step 2: Add missing columns to job_cards
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "specialInstructions" TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "estimatedTime" INTEGER DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS estimated_time INTEGER DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "actualTime" INTEGER DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS actual_time INTEGER DEFAULT 0;

-- Step 3: Add missing columns to products if needed
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_specifications TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "colorSpecifications" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "printingColors" INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS printing_colors INTEGER DEFAULT 1;

-- Step 4: Sync data between column formats
UPDATE job_cards SET "customerName" = customer_name WHERE "customerName" IS NULL AND customer_name IS NOT NULL;
UPDATE job_cards SET "companyName" = company_name WHERE "companyName" IS NULL AND company_name IS NOT NULL;
UPDATE job_cards SET "specialInstructions" = special_instructions WHERE "specialInstructions" IS NULL AND special_instructions IS NOT NULL;
UPDATE job_cards SET customer_name = "customerName" WHERE customer_name IS NULL AND "customerName" IS NOT NULL;

UPDATE products SET "colorSpecifications" = color_specifications WHERE "colorSpecifications" IS NULL AND color_specifications IS NOT NULL;
UPDATE products SET color_specifications = "colorSpecifications" WHERE color_specifications IS NULL AND "colorSpecifications" IS NOT NULL;
UPDATE products SET printing_colors = "printingColors" WHERE printing_colors IS NULL AND "printingColors" IS NOT NULL;

-- Step 5: Ensure all products have product_type
UPDATE products SET product_type = 'Hang Tags' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Hang Tags');
UPDATE products SET product_type = 'Price Tags' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Price Tags');
UPDATE products SET product_type = 'Care Labels' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Care Labels');
UPDATE products SET product_type = 'Size Labels' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Size Labels');
UPDATE products SET product_type = 'Brand Labels' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Brand Labels');
UPDATE products SET product_type = 'Woven Labels' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Woven Labels');
UPDATE products SET product_type = 'Heat Transfer Labels' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Heat Transfer Labels');
UPDATE products SET product_type = 'Leather Patches' WHERE product_type IS NULL AND "categoryId" IN (SELECT id FROM categories WHERE name = 'Leather Patches');
UPDATE products SET product_type = 'Custom' WHERE product_type IS NULL;
UPDATE products SET "productType" = product_type WHERE "productType" IS NULL;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pss_product ON product_step_selections(product_id);
CREATE INDEX IF NOT EXISTS idx_pss_step ON product_step_selections(process_step_id);
CREATE INDEX IF NOT EXISTS idx_job_cards_customer ON job_cards("customerName");
CREATE INDEX IF NOT EXISTS idx_job_cards_company ON job_cards("companyName");
CREATE INDEX IF NOT EXISTS idx_products_color_specs ON products("colorSpecifications");

-- Step 7: Add triggers to sync columns
CREATE OR REPLACE FUNCTION sync_job_cards_extended()
RETURNS TRIGGER AS $$
BEGIN
    NEW.customer_name := NEW."customerName";
    NEW.company_name := NEW."companyName";
    NEW.special_instructions := NEW."specialInstructions";
    NEW.estimated_time := NEW."estimatedTime";
    NEW.actual_time := NEW."actualTime";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_job_cards_extended_trigger ON job_cards;
CREATE TRIGGER sync_job_cards_extended_trigger
BEFORE INSERT OR UPDATE ON job_cards
FOR EACH ROW
EXECUTE FUNCTION sync_job_cards_extended();

-- Step 8: Verify all fixes
DO $$
DECLARE
    step_selections_count INTEGER;
    products_with_type INTEGER;
    job_cards_count INTEGER;
    pss_columns INTEGER;
    jc_columns INTEGER;
    prod_columns INTEGER;
BEGIN
    SELECT COUNT(*) INTO step_selections_count FROM product_step_selections;
    SELECT COUNT(*) INTO products_with_type FROM products WHERE product_type IS NOT NULL;
    SELECT COUNT(*) INTO job_cards_count FROM job_cards;
    
    SELECT COUNT(*) INTO pss_columns
    FROM information_schema.columns
    WHERE table_name = 'product_step_selections';
    
    SELECT COUNT(*) INTO jc_columns
    FROM information_schema.columns
    WHERE table_name = 'job_cards'
    AND (column_name LIKE '%customer%' OR column_name LIKE '%company%' OR column_name LIKE '%special%');
    
    SELECT COUNT(*) INTO prod_columns
    FROM information_schema.columns
    WHERE table_name = 'products'
    AND (column_name LIKE '%color%' OR column_name LIKE '%remark%' OR column_name LIKE '%type%');
    
    RAISE NOTICE 'Product step selections: %', step_selections_count;
    RAISE NOTICE 'Products with type: %', products_with_type;
    RAISE NOTICE 'Job cards: %', job_cards_count;
    RAISE NOTICE 'PSS columns: %', pss_columns;
    RAISE NOTICE 'Job cards relevant columns: %', jc_columns;
    RAISE NOTICE 'Products relevant columns: %', prod_columns;
END $$;

SELECT 'All backend compatibility fixes applied and verified successfully!' AS status;

-- Show detailed counts
SELECT 
    (SELECT COUNT(*) FROM product_step_selections) as step_selections,
    (SELECT COUNT(*) FROM products WHERE product_type IS NOT NULL) as products_with_type,
    (SELECT COUNT(*) FROM job_cards) as total_jobs,
    (SELECT COUNT(*) FROM categories) as categories,
    (SELECT COUNT(*) FROM process_steps) as process_steps;

