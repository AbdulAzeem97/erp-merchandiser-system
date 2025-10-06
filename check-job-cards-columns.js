import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkJobCardsColumns() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'job_cards'
      ORDER BY ordinal_position
    `);
    
    console.log('job_cards table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkJobCardsColumns();

