/**
 * Add MITCHELL material to database
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function addMaterial() {
  try {
    const materialName = 'MITCHELL';
    
    console.log(`➕ Adding material: ${materialName}\n`);
    
    // Check if it already exists
    const checkQuery = `
      SELECT id FROM materials 
      WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
    `;
    
    const checkResult = await pool.query(checkQuery, [materialName]);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Material already exists:');
      console.log(`   ID: ${checkResult.rows[0].id}`);
      await pool.end();
      process.exit(0);
    }
    
    // Insert the material
    const insertQuery = `
      INSERT INTO materials (name, unit, "isActive", "createdAt", "updatedAt")
      VALUES ($1, 'sheets', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, unit
    `;
    
    const insertResult = await pool.query(insertQuery, [materialName]);
    
    console.log('✅ Material added successfully:');
    console.log(JSON.stringify(insertResult.rows[0], null, 2));
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await pool.end();
    process.exit(1);
  }
}

addMaterial();

