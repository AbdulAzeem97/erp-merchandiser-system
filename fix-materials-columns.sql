-- Add missing columns to materials table for backend compatibility

-- Step 1: Add missing columns with proper data types
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "costPerUnit" NUMERIC(12,2) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(12,2) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "unitPrice" NUMERIC(12,2) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "minimumStock" INTEGER DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS minimum_stock INTEGER DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "reorderLevel" INTEGER DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Set default values and sync data
UPDATE materials SET "costPerUnit" = 0.25 WHERE "costPerUnit" IS NULL OR "costPerUnit" = 0;
UPDATE materials SET cost_per_unit = "costPerUnit" WHERE cost_per_unit IS NULL OR cost_per_unit = 0;
UPDATE materials SET "unitPrice" = "costPerUnit" WHERE "unitPrice" IS NULL OR "unitPrice" = 0;
UPDATE materials SET unit_price = "costPerUnit" WHERE unit_price IS NULL or unit_price = 0;
UPDATE materials SET "isActive" = true WHERE "isActive" IS NULL;
UPDATE materials SET is_active = "isActive" WHERE is_active IS NULL;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_materials_cost ON materials("costPerUnit");
CREATE INDEX IF NOT EXISTS idx_materials_unit ON materials(unit);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials("isActive");
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON materials(supplier);

-- Step 4: Add check constraints for data validation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materials_cost_positive') THEN
        ALTER TABLE materials 
        ADD CONSTRAINT materials_cost_positive 
        CHECK ("costPerUnit" >= 0);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'materials_stock_positive') THEN
        ALTER TABLE materials 
        ADD CONSTRAINT materials_stock_positive 
        CHECK ("minimumStock" >= 0);
    END IF;
END $$;

-- Step 5: Add trigger to sync camelCase and snake_case columns
CREATE OR REPLACE FUNCTION sync_materials_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.cost_per_unit := NEW."costPerUnit";
    NEW.unit_price := NEW."unitPrice";
    NEW.minimum_stock := NEW."minimumStock";
    NEW.reorder_level := NEW."reorderLevel";
    NEW.is_active := NEW."isActive";
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_materials_trigger ON materials;
CREATE TRIGGER sync_materials_trigger
BEFORE INSERT OR UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION sync_materials_columns();

-- Step 6: Verify changes
DO $$
DECLARE
    column_count INTEGER;
    index_count INTEGER;
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'materials';
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'materials';
    
    SELECT COUNT(*) INTO row_count
    FROM materials;
    
    RAISE NOTICE 'Columns in materials: %', column_count;
    RAISE NOTICE 'Indexes on materials: %', index_count;
    RAISE NOTICE 'Rows in materials: %', row_count;
END $$;

SELECT 'Materials table fixed and enhanced!' AS status;

-- Display sample data
SELECT id, name, "costPerUnit", unit, supplier, "isActive" FROM materials LIMIT 5;

