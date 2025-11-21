/**
 * Create default sheet sizes for materials that don't have any sizes defined
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function createDefaultSizes() {
  try {
    console.log('🔍 Checking materials without sheet sizes...\n');
    
    // Get all materials that are referenced in jobs but don't have sizes
    const materialsQuery = `
      SELECT DISTINCT m.id, m.name
      FROM materials m
      WHERE m."isActive" = true
      AND NOT EXISTS (
        SELECT 1 FROM material_sizes ms 
        WHERE ms.inventory_material_id = m.id OR ms.inventory_material_id::text = m.id::text
      )
      ORDER BY m.name
    `;
    
    const materials = await pool.query(materialsQuery);
    
    console.log(`📋 Found ${materials.rows.length} materials without sheet sizes:\n`);
    
    if (materials.rows.length === 0) {
      console.log('✅ All materials have sheet sizes defined!');
      await pool.end();
      process.exit(0);
    }
    
    // Common standard sheet sizes (in mm)
    const defaultSizes = [
      { name: 'A4', width: 210, height: 297 },
      { name: 'A3', width: 297, height: 420 },
      { name: 'A2', width: 420, height: 594 },
      { name: 'A1', width: 594, height: 841 },
      { name: 'A0', width: 841, height: 1189 },
      { name: 'Standard Large', width: 1000, height: 1400 },
      { name: 'Standard XL', width: 1200, height: 1600 }
    ];
    
    // For production materials, use larger sizes
    const productionSizes = [
      { name: 'Standard Sheet', width: 1000, height: 1400, is_default: true },
      { name: 'Large Sheet', width: 1200, height: 1600 },
      { name: 'XL Sheet', width: 1400, height: 2000 }
    ];
    
    for (const material of materials.rows) {
      console.log(`\n➕ Processing: ${material.name} (ID: ${material.id})`);
      
      // Use production sizes for all materials
      for (let i = 0; i < productionSizes.length; i++) {
        const size = productionSizes[i];
        try {
          // Use SERIAL (auto-increment) - don't specify id
          const insertQuery = `
            INSERT INTO material_sizes (
              inventory_material_id, 
              size_name, 
              width_mm, 
              height_mm, 
              is_default, 
              is_active,
              created_at,
              updated_at
            )
            VALUES ($1, $2, $3, $4, $5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, size_name
          `;
          
          const result = await pool.query(insertQuery, [
            material.id.toString(),
            `${material.name} - ${size.name}`,
            size.width,
            size.height,
            size.is_default ? 1 : 0
          ]);
          
          console.log(`  ✅ Created: ${result.rows[0].size_name} (${size.width}×${size.height}mm)`);
        } catch (error) {
          if (error.code === '23505' || error.message.includes('unique')) {
            console.log(`  ⚠️  Size already exists, skipping`);
          } else {
            console.error(`  ❌ Error creating size:`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Done!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

createDefaultSizes();

