/**
 * Check all materials referenced in jobs and add missing ones
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function checkAllJobMaterials() {
  try {
    console.log('🔍 Checking materials referenced in jobs...\n');
    
    // Get all unique material names from products (brand field)
    const materialNamesQuery = `
      SELECT DISTINCT COALESCE(p.brand, 'N/A') as material_name
      FROM prepress_jobs pj
      JOIN job_cards jc ON pj.job_card_id = jc.id
      LEFT JOIN products p ON jc."productId" = p.id
      WHERE COALESCE(pj.plate_generated, false) = true
      AND p.brand IS NOT NULL
      AND p.brand != 'N/A'
      ORDER BY material_name
    `;
    
    const materialNames = await pool.query(materialNamesQuery);
    
    console.log(`📋 Found ${materialNames.rows.length} unique materials in jobs:\n`);
    
    const missingMaterials = [];
    
    for (const row of materialNames.rows) {
      const materialName = row.material_name.trim();
      
      // Check if material exists
      const checkQuery = `
        SELECT id FROM materials 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
      `;
      
      const checkResult = await pool.query(checkQuery, [materialName]);
      
      if (checkResult.rows.length > 0) {
        console.log(`✅ ${materialName} - ID: ${checkResult.rows[0].id}`);
      } else {
        console.log(`❌ ${materialName} - MISSING`);
        missingMaterials.push(materialName);
      }
    }
    
    if (missingMaterials.length > 0) {
      console.log(`\n⚠️  ${missingMaterials.length} materials are missing:`);
      missingMaterials.forEach(name => console.log(`   - ${name}`));
      
      console.log('\n💡 Adding missing materials...\n');
      
      for (const materialName of missingMaterials) {
        try {
          const insertQuery = `
            INSERT INTO materials (name, unit, "isActive", "createdAt", "updatedAt")
            VALUES ($1, 'sheets', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, name
          `;
          
          const insertResult = await pool.query(insertQuery, [materialName]);
          console.log(`✅ Added: ${insertResult.rows[0].name} (ID: ${insertResult.rows[0].id})`);
        } catch (error) {
          console.error(`❌ Failed to add ${materialName}:`, error.message);
        }
      }
    } else {
      console.log('\n✅ All materials exist in database!');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

checkAllJobMaterials();

