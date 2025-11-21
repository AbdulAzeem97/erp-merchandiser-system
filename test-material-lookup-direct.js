/**
 * Test material lookup exactly as the backend does it
 */

import dbAdapter from './server/database/adapter.js';

async function testLookup() {
  try {
    await dbAdapter.initialize();
    console.log('✅ Database initialized\n');
    
    const testMaterials = ['PULL & BEAR', 'AHLENS'];
    
    for (const materialName of testMaterials) {
      console.log(`\n🔍 Testing lookup for: "${materialName}"`);
      
      // Exact same query as backend
      const directMaterialQuery = `
        SELECT id FROM materials 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
        LIMIT 1
      `;
      
      const directResult = await dbAdapter.query(directMaterialQuery, [materialName]);
      
      if (directResult.rows.length > 0) {
        console.log(`  ✅ Found: ID = ${directResult.rows[0].id}`);
      } else {
        console.log(`  ❌ NOT FOUND`);
        
        // Check what exists
        const allQuery = `SELECT id, name FROM materials WHERE LOWER(name) LIKE LOWER($1) LIMIT 5`;
        const allResult = await dbAdapter.query(allQuery, [`%${materialName.replace('&', '')}%`]);
        if (allResult.rows.length > 0) {
          console.log(`  📋 Similar materials:`);
          allResult.rows.forEach(r => console.log(`     "${r.name}" (ID: ${r.id})`));
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLookup();

