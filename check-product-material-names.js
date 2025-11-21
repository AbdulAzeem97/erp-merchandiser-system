/**
 * Check exact material names in products table
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function checkProductMaterialNames() {
  try {
    console.log('🔍 Checking material names in products table...\n');
    
    const query = `
      SELECT DISTINCT 
        p.brand as product_brand,
        p.name as product_name,
        jc.id as job_card_id,
        pj.id as prepress_job_id
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      WHERE COALESCE(pj.plate_generated, false) = true
      AND p.brand IS NOT NULL
      AND (LOWER(p.brand) LIKE '%pull%' OR LOWER(p.brand) LIKE '%ahlens%')
      ORDER BY p.brand
    `;
    
    const result = await pool.query(query);
    
    console.log(`📋 Found ${result.rows.length} jobs with these materials:\n`);
    
    result.rows.forEach(row => {
      console.log(`Product: ${row.product_name}`);
      console.log(`  Brand: "${row.product_brand}"`);
      console.log(`  Job Card ID: ${row.job_card_id}`);
      console.log(`  Prepress Job ID: ${row.prepress_job_id}`);
      console.log('');
    });
    
    // Test lookup with exact values
    console.log('\n🧪 Testing lookup with exact brand values:\n');
    for (const row of result.rows) {
      const brand = row.product_brand;
      const lookupQuery = `
        SELECT id, name FROM materials 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
      `;
      const lookupResult = await pool.query(lookupQuery, [brand]);
      if (lookupResult.rows.length > 0) {
        console.log(`✅ "${brand}" → Found: ID ${lookupResult.rows[0].id}`);
      } else {
        console.log(`❌ "${brand}" → NOT FOUND`);
        // Show what exists
        const similarQuery = `
          SELECT id, name FROM materials 
          WHERE LOWER(name) LIKE LOWER($1)
        `;
        const similarResult = await pool.query(similarQuery, [`%${brand}%`]);
        if (similarResult.rows.length > 0) {
          console.log(`   Similar: ${similarResult.rows.map(r => r.name).join(', ')}`);
        }
      }
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkProductMaterialNames();

