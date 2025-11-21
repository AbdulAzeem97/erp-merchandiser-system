/**
 * Test material lookup with exact names from jobs
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function testMaterialLookup() {
  try {
    const testMaterials = ['PULL & BEAR', 'AHLENS', 'MITCHELL'];
    
    console.log('🧪 Testing material lookup...\n');
    
    for (const materialName of testMaterials) {
      console.log(`\n🔍 Testing: "${materialName}"`);
      
      // Strategy 1: Direct lookup
      const directQuery = `
        SELECT id FROM materials 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        LIMIT 1
      `;
      
      const directResult = await pool.query(directQuery, [materialName]);
      if (directResult.rows.length > 0) {
        console.log(`  ✅ Direct lookup: ID = ${directResult.rows[0].id}`);
      } else {
        console.log(`  ❌ Direct lookup: NOT FOUND`);
        
        // Check what exists
        const checkQuery = `
          SELECT id, name FROM materials 
          WHERE LOWER(name) LIKE LOWER($1)
          LIMIT 5
        `;
        const checkResult = await pool.query(checkQuery, [`%${materialName}%`]);
        if (checkResult.rows.length > 0) {
          console.log(`  📋 Similar materials found:`);
          checkResult.rows.forEach(row => {
            console.log(`     - "${row.name}" (ID: ${row.id})`);
          });
        }
      }
    }
    
    // Also check what's in products table
    console.log('\n📋 Materials from products.brand:');
    const brandQuery = `
      SELECT DISTINCT p.brand
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      WHERE COALESCE(pj.plate_generated, false) = true
      AND p.brand IS NOT NULL
      ORDER BY p.brand
    `;
    const brandResult = await pool.query(brandQuery);
    brandResult.rows.forEach(row => {
      console.log(`  - "${row.brand}"`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testMaterialLookup();

