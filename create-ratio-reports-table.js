import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER || 'erp_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'erp_merchandiser',
  password: process.env.DB_PASSWORD || 'DevPassword123!',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function createRatioReportsTable() {
  const client = await pool.connect();
  
  try {
    console.log('📊 Creating ratio_reports table...');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'create-ratio-reports-table.sql'), 'utf8');
    
    // Execute the SQL
    await client.query(sqlFile);
    
    console.log('✅ ratio_reports table created successfully!');
    
    // Verify the table exists
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ratio_reports'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table Structure:');
    console.log('Column Name | Data Type | Nullable');
    console.log('----------------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} | ${row.data_type.padEnd(15)} | ${row.is_nullable}`);
    });
    
    // Check if there are any existing records
    const countResult = await client.query('SELECT COUNT(*) as count FROM ratio_reports');
    console.log(`\n📊 Total records: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error creating ratio_reports table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createRatioReportsTable()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

