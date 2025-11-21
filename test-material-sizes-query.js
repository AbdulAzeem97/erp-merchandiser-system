/**
 * Test material sizes query for PULL & BEAR
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function testMaterialSizes() {
  try {
    const materialId = '97'; // PULL & BEAR
    
    console.log(`🧪 Testing material sizes query for material ID: ${materialId}\n`);
    
    // Test the exact query from materialSizeService
    const sizeCount = await pool.query(
      `SELECT COUNT(*) as count FROM material_sizes 
       WHERE inventory_material_id = $1 AND is_active = 1`,
      [materialId]
    );
    
    const count = parseInt(sizeCount.rows[0]?.count || 0);
    console.log(`✅ Size count: ${count}`);
    
    if (count > 0) {
      // Check if inventory_stock exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'inventory_stock'
        )
      `);
      const hasInventoryStock = tableCheck.rows[0].exists;
      
      let result;
      if (hasInventoryStock) {
        result = await pool.query(
          `SELECT 
            ms.*,
            COALESCE(SUM(ist.current_stock), 0) as current_stock,
            COALESCE(SUM(ist.reserved_stock), 0) as reserved_stock,
            COALESCE(SUM(ist.available_stock), 0) as available_stock
           FROM material_sizes ms
           LEFT JOIN inventory_stock ist ON ist.material_size_id = ms.id 
             AND ist.inventory_material_id = ms.inventory_material_id
           WHERE ms.inventory_material_id = $1 AND ms.is_active = 1
           GROUP BY ms.id
           ORDER BY ms.is_default DESC, ms.width_mm DESC, ms.height_mm DESC`,
          [materialId]
        );
      } else {
        result = await pool.query(
          `SELECT 
            ms.*,
            0 as current_stock,
            0 as reserved_stock,
            0 as available_stock
           FROM material_sizes ms
           WHERE ms.inventory_material_id = $1 AND ms.is_active = 1
           ORDER BY ms.is_default DESC, ms.width_mm DESC, ms.height_mm DESC`,
          [materialId]
        );
      }
      
      console.log(`\n📋 Found ${result.rows.length} sizes:\n`);
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.size_name}`);
        console.log(`   Size: ${row.width_mm} × ${row.height_mm} mm`);
        console.log(`   ID: ${row.id}`);
        console.log(`   inventory_material_id: ${row.inventory_material_id}`);
        console.log(`   is_default: ${row.is_default}`);
        console.log('');
      });
    } else {
      console.log('❌ No sizes found');
      
      // Check what's in the table
      const allSizes = await pool.query(
        `SELECT id, inventory_material_id, size_name FROM material_sizes 
         WHERE inventory_material_id::text = $1 
         LIMIT 5`,
        [materialId]
      );
      
      if (allSizes.rows.length > 0) {
        console.log('📋 Sizes found with text comparison:');
        allSizes.rows.forEach(row => {
          console.log(`  - ${row.size_name} (ID: ${row.id}, material_id: ${row.inventory_material_id}, type: ${typeof row.inventory_material_id})`);
        });
      }
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

testMaterialSizes();

