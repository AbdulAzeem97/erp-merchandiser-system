import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function checkStructure() {
  try {
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('prepress_jobs', 'job_cards', 'job_production_planning', 'products', 'companies')
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:');
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));
    
    // Check prepress_jobs columns
    if (tables.rows.find(r => r.table_name === 'prepress_jobs')) {
      const prepressCols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'prepress_jobs'
        ORDER BY ordinal_position
      `);
      console.log('\n📋 prepress_jobs columns:');
      prepressCols.rows.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`));
    }
    
    // Check job_cards columns
    if (tables.rows.find(r => r.table_name === 'job_cards')) {
      const jobCardsCols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'job_cards'
        ORDER BY ordinal_position
      `);
      console.log('\n📋 job_cards all columns:');
      jobCardsCols.rows.forEach(col => console.log(`   - ${col.column_name} (${col.data_type})`));
    }
    
    // Check if job_production_planning exists
    const planningCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_production_planning'
      )
    `);
    console.log(`\n📋 job_production_planning table exists: ${planningCheck.rows[0].exists}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkStructure();

