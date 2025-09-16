import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkTables() {
  const client = await pool.connect();
  try {
    console.log('📋 Checking available tables:');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Available tables:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();