/**
 * Check if material exists and add it if missing
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function checkAndAddMaterial() {
  try {
    const materialName = 'MITCHELL';
    
    console.log(`🔍 Checking for material: ${materialName}\n`);
    
    // Check if materials table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'materials'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Materials table does not exist');
      await pool.end();
      process.exit(1);
    }
    
    // Check if material exists
    const checkQuery = `
      SELECT id, name, unit, "isActive" 
      FROM materials 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
    `;
    
    const result = await pool.query(checkQuery, [materialName]);
    
    if (result.rows.length > 0) {
      console.log('✅ Material found:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ Material not found');
      console.log('\n📋 All materials in database:');
      
      const allMaterials = await pool.query(`
        SELECT id, name, unit, "isActive" 
        FROM materials 
        ORDER BY name
        LIMIT 20
      `);
      
      if (allMaterials.rows.length > 0) {
        allMaterials.rows.forEach(mat => {
          console.log(`  - ${mat.name} (ID: ${mat.id}, Unit: ${mat.unit || 'N/A'})`);
        });
      } else {
        console.log('  No materials found in database');
      }
      
      // Ask if user wants to create it
      console.log(`\n💡 To add "${materialName}" material, you can:`);
      console.log(`   1. Use the inventory management interface`);
      console.log(`   2. Or run: INSERT INTO materials (name, unit, "isActive") VALUES ('${materialName}', 'sheets', true);`);
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

checkAndAddMaterial();

