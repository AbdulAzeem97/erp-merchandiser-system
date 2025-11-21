/**
 * Check job_cards table columns
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function checkJobCardsColumns() {
  try {
    console.log('🔍 Checking job_cards table columns...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 All columns in job_cards:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    // Check specific columns we're using
    console.log('\n🔍 Checking specific columns we use:');
    const columnsToCheck = ['priority', 'dueDate', 'due_date', 'deadline'];
    for (const col of columnsToCheck) {
      const exists = result.rows.some(r => r.column_name === col || r.column_name === `"${col}"`);
      console.log(`  ${col}: ${exists ? '✅' : '❌'}`);
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkJobCardsColumns();

