import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkStatusConstraint() {
  const client = await pool.connect();
  
  try {
    // Check the constraint definition
    const result = await client.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conname = 'prepress_jobs_status_check'
    `);
    
    console.log('prepress_jobs_status_check constraint:');
    console.log(result.rows[0]?.constraint_definition);
    
    // Also check actual distinct statuses in the table
    const statusResult = await client.query(`
      SELECT DISTINCT status
      FROM prepress_jobs
      ORDER BY status
    `);
    
    console.log('\nCurrent statuses in prepress_jobs:');
    statusResult.rows.forEach(row => {
      console.log(`  - ${row.status}`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkStatusConstraint();

