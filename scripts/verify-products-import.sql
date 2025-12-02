-- Verify products import and re-add foreign key constraint

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

-- Verify jobs can reference products
SELECT 
    COUNT(*) as total_jobs,
    COUNT(DISTINCT jc."productId") as unique_products_referenced,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as jobs_with_valid_products,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as jobs_with_missing_products
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id;

-- Show sample jobs with products
SELECT 
    jc.id,
    jc."jobNumber",
    jc.customer_name,
    p.name as product_name,
    p.id as product_id
FROM job_cards jc
LEFT JOIN products p ON jc."productId" = p.id
ORDER BY jc.id
LIMIT 10;

