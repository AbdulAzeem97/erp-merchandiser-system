/**
 * Check which tables have priority column
 */

import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function checkPriorityColumns() {
  try {
    console.log('🔍 Checking priority columns...\n');
    
    // Check job_cards
    const jobCardsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' AND column_name = 'priority'
    `);
    console.log('job_cards.priority:', jobCardsCheck.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND');
    if (jobCardsCheck.rows.length > 0) {
      console.log('  Type:', jobCardsCheck.rows[0].data_type);
    }
    
    // Check prepress_jobs
    const prepressCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prepress_jobs' AND column_name = 'priority'
    `);
    console.log('prepress_jobs.priority:', prepressCheck.rows.length > 0 ? '✅ EXISTS' : '❌ NOT FOUND');
    if (prepressCheck.rows.length > 0) {
      console.log('  Type:', prepressCheck.rows[0].data_type);
    }
    
    // List all columns in prepress_jobs
    console.log('\n📋 All columns in prepress_jobs:');
    const allPrepressColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prepress_jobs'
      ORDER BY ordinal_position
    `);
    allPrepressColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkPriorityColumns();

