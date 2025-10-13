-- Add all missing camelCase columns to products table for backend compatibility

-- Step 1: Add camelCase versions and additional required columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS "categoryId" INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "materialId" INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "productType" VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS "fscCertified" BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "fscLicense" VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS "basePrice" NUMERIC(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "unitPrice" NUMERIC(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "createdById" INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "updatedById" INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "minimumStock" INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS gsm INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);

-- Step 2: Copy values from snake_case to camelCase
UPDATE products SET "categoryId" = category_id WHERE "categoryId" IS NULL AND category_id IS NOT NULL;
UPDATE products SET "materialId" = material_id WHERE "materialId" IS NULL AND material_id IS NOT NULL;
UPDATE products SET "productType" = product_type WHERE "productType" IS NULL AND product_type IS NOT NULL;
UPDATE products SET "fscCertified" = fsc_certified WHERE "fscCertified" IS NULL AND fsc_certified IS NOT NULL;
UPDATE products SET "fscLicense" = fsc_certificate_number WHERE "fscLicense" IS NULL AND fsc_certificate_number IS NOT NULL;
UPDATE products SET "basePrice" = base_price WHERE "basePrice" IS NULL AND base_price IS NOT NULL;
UPDATE products SET "unitPrice" = "basePrice" WHERE "unitPrice" IS NULL OR "unitPrice" = 0;
UPDATE products SET "isActive" = true WHERE "isActive" IS NULL;

-- Step 3: Add foreign key constraints for camelCase columns
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_camel_fk;
ALTER TABLE products ADD CONSTRAINT products_category_camel_fk 
FOREIGN KEY ("categoryId") REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_material_camel_fk;
ALTER TABLE products ADD CONSTRAINT products_material_camel_fk 
FOREIGN KEY ("materialId") REFERENCES materials(id) ON DELETE SET NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_created_by_fk;
ALTER TABLE products ADD CONSTRAINT products_created_by_fk 
FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_updated_by_fk;
ALTER TABLE products ADD CONSTRAINT products_updated_by_fk 
FOREIGN KEY ("updatedById") REFERENCES users(id) ON DELETE SET NULL;

-- Step 4: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_material ON products("materialId");
CREATE INDEX IF NOT EXISTS idx_products_type ON products("productType");
CREATE INDEX IF NOT EXISTS idx_products_fsc ON products("fscCertified");
CREATE INDEX IF NOT EXISTS idx_products_active ON products("isActive");
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products("createdById");

-- Step 5: Add check constraints for data validation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_positive') THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_price_positive 
        CHECK ("basePrice" >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_positive') THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_stock_positive 
        CHECK ("stockQuantity" >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_gsm_positive') THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_gsm_positive 
        CHECK (gsm IS NULL OR gsm > 0);
    END IF;
END $$;

-- Step 6: Add trigger to sync camelCase and snake_case columns
CREATE OR REPLACE FUNCTION sync_products_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.category_id := NEW."categoryId";
    NEW.material_id := NEW."materialId";
    NEW.product_type := NEW."productType";
    NEW.fsc_certified := NEW."fscCertified";
    NEW.fsc_certificate_number := NEW."fscLicense";
    NEW.base_price := NEW."basePrice";
    NEW.is_active := NEW."isActive";
    NEW.stock_quantity := NEW."stockQuantity";
    NEW.minimum_stock := NEW."minimumStock";
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_products_trigger ON products;
CREATE TRIGGER sync_products_trigger
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION sync_products_columns();

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
    WHERE table_name = 'products';
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'products';
    
    SELECT COUNT(*) INTO fk_count
    FROM pg_constraint
    WHERE conrelid = 'products'::regclass
    AND contype = 'f';
    
    SELECT COUNT(*) INTO row_count
    FROM products;
    
    RAISE NOTICE 'Columns in products: %', column_count;
    RAISE NOTICE 'Indexes on products: %', index_count;
    RAISE NOTICE 'Foreign keys on products: %', fk_count;
    RAISE NOTICE 'Rows in products: %', row_count;
END $$;

SELECT 'All products columns fixed and enhanced successfully!' AS status;

-- Display sample data
SELECT id, name, code, "productType", "categoryId", "materialId", "basePrice", "isActive" 
FROM products LIMIT 5;

