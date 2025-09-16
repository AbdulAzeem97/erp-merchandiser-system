import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function testDB() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT COUNT(*) as total FROM job_cards');
    console.log('Success! Found', result.rows[0].total, 'jobs');
    
    const jobs = await pool.query('SELECT * FROM job_cards LIMIT 3');
    console.log('Sample jobs:', jobs.rows.map(j => j.jobNumber));
    
    await pool.end();
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

testDB();
