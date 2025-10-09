-- Fix Products Table - Add Missing Columns
-- Run this if products table is missing columns

-- Add material_id column
ALTER TABLE products ADD COLUMN IF NOT EXISTS material_id INTEGER;

-- Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_products_material 
FOREIGN KEY (material_id) REFERENCES materials(id) 
ON DELETE SET NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Show success message
SELECT 'Products table fixed successfully!' AS status;

