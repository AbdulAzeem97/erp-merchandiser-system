import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function runCTPMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🖨️ Adding CTP fields to prepress_jobs table...');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync(path.join(__dirname, 'add-ctp-fields.sql'), 'utf8');
    
    // Execute the SQL
    await client.query(sqlFile);
    
    console.log('✅ CTP fields added successfully!');
    
    // Verify the new columns exist
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'prepress_jobs'
      AND column_name LIKE '%plate%' OR column_name LIKE '%ctp%'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 CTP-Related Columns:');
    console.log('Column Name | Data Type | Nullable');
    console.log('----------------------------------------');
    result.rows.forEach(row => {
      console.log(`${row.column_name.padEnd(25)} | ${row.data_type.padEnd(15)} | ${row.is_nullable}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding CTP fields:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runCTPMigration()
  .then(() => {
    console.log('\n✅ CTP migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });

