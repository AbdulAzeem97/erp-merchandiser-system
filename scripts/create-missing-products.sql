-- Create dummy products for missing product IDs referenced by jobs

-- Get a default category ID (use first available category)
DO $$
DECLARE
    default_category_id INTEGER;
    missing_product_id INTEGER;
BEGIN
    -- Get first category ID
    SELECT id INTO default_category_id FROM categories LIMIT 1;
    
    IF default_category_id IS NULL THEN
        RAISE EXCEPTION 'No categories found. Please create at least one category first.';
    END IF;
    
    -- Create missing products
    FOR missing_product_id IN 
        SELECT DISTINCT jc."productId"
        FROM job_cards jc
        LEFT JOIN products p ON jc."productId" = p.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO products (
            id, 
            name, 
            sku, 
            "categoryId",
            "fscCertified",
            "basePrice",
            "isActive",
            "createdAt",
            "updatedAt"
        )
        VALUES (
            missing_product_id,
            'Imported Product (ID: ' || missing_product_id || ')',
            'PROD-IMPORTED-' || missing_product_id,
            default_category_id,
            false,
            0,
            true,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Created product with ID: %', missing_product_id;
    END LOOP;
END $$;

-- Re-add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'job_cards_productId_fkey' 
        AND conrelid = 'job_cards'::regclass
    ) THEN
        ALTER TABLE job_cards 
        ADD CONSTRAINT job_cards_productId_fkey 
        FOREIGN KEY ("productId") REFERENCES products(id);
        RAISE NOTICE 'Foreign key constraint re-added';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Verify all jobs have valid products
SELECT 
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as jobs_with_products,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as jobs_with_missing_products
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id;

