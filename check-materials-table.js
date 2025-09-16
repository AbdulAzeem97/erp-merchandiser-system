import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkMaterialsTable() {
  const client = await pool.connect();
  try {
    console.log('📋 Checking materials table structure:');
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'materials' 
      ORDER BY column_name;
    `);
    console.log('Materials table columns:');
    columns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Check if there's any data in the materials table
    console.log('\n📊 Materials table content:');
    const data = await client.query('SELECT COUNT(*) FROM materials');
    console.log(`Total records: ${data.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkMaterialsTable();