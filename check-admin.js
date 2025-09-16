import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkAdminUser() {
  const client = await pool.connect();
  try {
    // Check data types for is_active columns in different tables
    const tableColumns = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE column_name = 'is_active'
      ORDER BY table_name;
    `);
    console.log('is_active column data types:');
    tableColumns.rows.forEach(col => {
      console.log(`- ${col.table_name}.${col.column_name}: ${col.data_type}`);
    });
    
    // Test the specific query that's failing
    console.log('\nTesting queries:');
    try {
      const usersResult = await client.query("SELECT COUNT(*) FROM users WHERE is_active = 1");
      console.log('✅ users WHERE is_active = 1:', usersResult.rows[0]);
    } catch (e) {
      console.log('❌ users WHERE is_active = 1:', e.message);
    }
    
    try {
      const companiesResult = await client.query("SELECT COUNT(*) FROM companies WHERE is_active = 1");
      console.log('✅ companies WHERE is_active = 1:', companiesResult.rows[0]);
    } catch (e) {
      console.log('❌ companies WHERE is_active = 1:', e.message);
    }
    
    try {
      const productsResult = await client.query("SELECT COUNT(*) FROM products WHERE is_active = 1");
      console.log('✅ products WHERE is_active = 1:', productsResult.rows[0]);
    } catch (e) {
      console.log('❌ products WHERE is_active = 1:', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAdminUser();