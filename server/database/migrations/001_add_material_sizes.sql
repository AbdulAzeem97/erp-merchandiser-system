-- Material Sizes Table Migration
-- Handles materials with multiple sizes (e.g., sheets in different dimensions)
-- Migration: 001_add_material_sizes.sql

-- Material Sizes Table
CREATE TABLE IF NOT EXISTS material_sizes (
    id SERIAL PRIMARY KEY,
    inventory_material_id INTEGER,
    size_name TEXT NOT NULL, -- e.g., "A4", "A3", "Custom 25x35"
    width_mm DECIMAL(10,2) NOT NULL, -- Width in millimeters
    height_mm DECIMAL(10,2) NOT NULL, -- Height in millimeters
    unit_cost DECIMAL(10,2), -- Cost per sheet of this size (optional, can inherit from material)
    is_default INTEGER DEFAULT 0, -- 1 if this is the default size for single-size materials
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_material_id, size_name)
);

-- Add foreign key constraint only if inventory_materials table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_materials') THEN
        ALTER TABLE material_sizes 
        ADD CONSTRAINT fk_material_sizes_inventory_material 
        FOREIGN KEY (inventory_material_id) REFERENCES inventory_materials(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update inventory_stock to link to specific size (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory_stock') THEN
        ALTER TABLE inventory_stock ADD COLUMN IF NOT EXISTS material_size_id INTEGER;
        IF EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'fk_inventory_stock_material_size') THEN
            ALTER TABLE inventory_stock DROP CONSTRAINT fk_inventory_stock_material_size;
        END IF;
        ALTER TABLE inventory_stock 
        ADD CONSTRAINT fk_inventory_stock_material_size 
        FOREIGN KEY (material_size_id) REFERENCES material_sizes(id);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_material_sizes_material_id ON material_sizes(inventory_material_id);
CREATE INDEX IF NOT EXISTS idx_material_sizes_active ON material_sizes(is_active);
CREATE INDEX IF NOT EXISTS idx_material_sizes_default ON material_sizes(is_default);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_size_id ON inventory_stock(material_size_id);

-- Comments for documentation
-- Note: For materials with single size, create one entry with is_default = 1
-- For materials with multiple sizes, create multiple entries, one can be marked as default

