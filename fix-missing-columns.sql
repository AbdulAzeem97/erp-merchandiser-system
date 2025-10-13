-- Fix Missing Columns for Products and Job Cards - Complete Migration

-- Step 1: Add missing columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "productType" TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS "skuCode" VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS length NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS width NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS height NUMERIC(10,2);

-- Step 2: Add missing columns to job_cards table  
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "poNumber" TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "orderQuantity" INTEGER DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS order_quantity INTEGER DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "deliveryDate" DATE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "targetDate" DATE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "productId" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "companyId" INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS company_id INTEGER;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "currentStep" VARCHAR(100);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS current_step VARCHAR(100);
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS "completedSteps" INTEGER DEFAULT 0;
ALTER TABLE job_cards ADD COLUMN IF NOT EXISTS completed_steps INTEGER DEFAULT 0;

-- Step 3: Sync data between column formats
UPDATE products SET "productType" = product_type WHERE "productType" IS NULL AND product_type IS NOT NULL;
UPDATE products SET product_type = "productType" WHERE product_type IS NULL AND "productType" IS NOT NULL;
UPDATE products SET "skuCode" = sku WHERE "skuCode" IS NULL AND sku IS NOT NULL;

UPDATE job_cards SET "poNumber" = po_number WHERE "poNumber" IS NULL AND po_number IS NOT NULL;
UPDATE job_cards SET po_number = "poNumber" WHERE po_number IS NULL AND "poNumber" IS NOT NULL;
UPDATE job_cards SET "orderQuantity" = quantity WHERE "orderQuantity" IS NULL AND quantity IS NOT NULL;
UPDATE job_cards SET order_quantity = "orderQuantity" WHERE order_quantity IS NULL AND "orderQuantity" IS NOT NULL;
UPDATE job_cards SET "deliveryDate" = delivery_date WHERE "deliveryDate" IS NULL AND delivery_date IS NOT NULL;
UPDATE job_cards SET delivery_date = "deliveryDate" WHERE delivery_date IS NULL AND "deliveryDate" IS NOT NULL;
UPDATE job_cards SET "targetDate" = target_date WHERE "targetDate" IS NULL AND target_date IS NOT NULL;
UPDATE job_cards SET target_date = "targetDate" WHERE target_date IS NULL AND "targetDate" IS NOT NULL;
UPDATE job_cards SET "productId" = product_id WHERE "productId" IS NULL AND product_id IS NOT NULL;
UPDATE job_cards SET product_id = "productId" WHERE product_id IS NULL AND "productId" IS NOT NULL;
UPDATE job_cards SET "companyId" = company_id WHERE "companyId" IS NULL AND company_id IS NOT NULL;
UPDATE job_cards SET company_id = "companyId" WHERE company_id IS NULL AND "companyId" IS NOT NULL;
UPDATE job_cards SET "currentStep" = current_step WHERE "currentStep" IS NULL AND current_step IS NOT NULL;
UPDATE job_cards SET current_step = "currentStep" WHERE current_step IS NULL AND "currentStep" IS NOT NULL;

-- Step 4: Add foreign key constraints if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_cards_product_fkey') THEN
        ALTER TABLE job_cards ADD CONSTRAINT job_cards_product_fkey 
        FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_cards_company_fkey') THEN
        ALTER TABLE job_cards ADD CONSTRAINT job_cards_company_fkey 
        FOREIGN KEY ("companyId") REFERENCES companies(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_cards_product_snake_fkey') THEN
        ALTER TABLE job_cards ADD CONSTRAINT job_cards_product_snake_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_cards_company_snake_fkey') THEN
        ALTER TABLE job_cards ADD CONSTRAINT job_cards_company_snake_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 5: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_type_both ON products(product_type, "productType");
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_job_cards_po_number ON job_cards("poNumber");
CREATE INDEX IF NOT EXISTS idx_job_cards_product ON job_cards("productId");
CREATE INDEX IF NOT EXISTS idx_job_cards_company ON job_cards("companyId");
CREATE INDEX IF NOT EXISTS idx_job_cards_delivery_date ON job_cards("deliveryDate");
CREATE INDEX IF NOT EXISTS idx_job_cards_target_date ON job_cards("targetDate");
CREATE INDEX IF NOT EXISTS idx_job_cards_current_step ON job_cards("currentStep");
CREATE INDEX IF NOT EXISTS idx_job_cards_quantity ON job_cards(quantity);

-- Step 6: Add check constraints for data validation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_cards_quantity_positive') THEN
        ALTER TABLE job_cards 
        ADD CONSTRAINT job_cards_quantity_positive 
        CHECK (quantity >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_dimensions_positive') THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_dimensions_positive 
        CHECK (weight IS NULL OR weight >= 0);
    END IF;
END $$;

-- Step 7: Add triggers to sync columns
CREATE OR REPLACE FUNCTION sync_missing_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'products' THEN
        NEW.product_type := NEW."productType";
        NEW.sku := NEW."skuCode";
    ELSIF TG_TABLE_NAME = 'job_cards' THEN
        NEW.po_number := NEW."poNumber";
        NEW.order_quantity := NEW."orderQuantity";
        NEW.delivery_date := NEW."deliveryDate";
        NEW.target_date := NEW."targetDate";
        NEW.product_id := NEW."productId";
        NEW.company_id := NEW."companyId";
        NEW.current_step := NEW."currentStep";
        NEW.completed_steps := NEW."completedSteps";
        NEW.updated_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_products_missing_trigger ON products;
CREATE TRIGGER sync_products_missing_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION sync_missing_columns();

DROP TRIGGER IF EXISTS sync_job_cards_missing_trigger ON job_cards;
CREATE TRIGGER sync_job_cards_missing_trigger
BEFORE INSERT OR UPDATE ON job_cards
FOR EACH ROW
EXECUTE FUNCTION sync_missing_columns();

-- Step 8: Verify changes
DO $$
DECLARE
    products_columns INTEGER;
    job_cards_columns INTEGER;
    products_indexes INTEGER;
    job_cards_indexes INTEGER;
BEGIN
    SELECT COUNT(*) INTO products_columns
    FROM information_schema.columns 
    WHERE table_name = 'products';
    
    SELECT COUNT(*) INTO job_cards_columns
    FROM information_schema.columns 
    WHERE table_name = 'job_cards';
    
    SELECT COUNT(*) INTO products_indexes
    FROM pg_indexes
    WHERE tablename = 'products';
    
    SELECT COUNT(*) INTO job_cards_indexes
    FROM pg_indexes
    WHERE tablename = 'job_cards';
    
    RAISE NOTICE 'Products columns: %', products_columns;
    RAISE NOTICE 'Job cards columns: %', job_cards_columns;
    RAISE NOTICE 'Products indexes: %', products_indexes;
    RAISE NOTICE 'Job cards indexes: %', job_cards_indexes;
END $$;

SELECT 'Missing columns added to products and job_cards tables successfully!' AS status;

-- Display sample data
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'products' AND (column_name LIKE '%type%' OR column_name LIKE '%sku%')
ORDER BY column_name;

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'job_cards' AND (column_name LIKE '%number%' OR column_name LIKE '%quantity%')
ORDER BY column_name;

