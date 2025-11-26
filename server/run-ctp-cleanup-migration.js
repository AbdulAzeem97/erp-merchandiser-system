import pg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'erp_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'erp_merchandiser',
  password: process.env.DB_PASSWORD || 'DevPassword123!',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 Running CTP machines cleanup migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'database/migrations/010_cleanup_ctp_machines.sql');
    const sql = await fs.readFile(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(sql);
    
    await client.query('COMMIT');
    console.log('✅ Migration completed successfully');
    
    // Verify results
    const result = await client.query(`
      SELECT machine_code, machine_name, is_active 
      FROM ctp_machines 
      WHERE is_active = true 
      ORDER BY machine_code
    `);
    
    console.log('\n📋 Active CTP machines after cleanup:');
    result.rows.forEach(row => {
      console.log(`  - ${row.machine_code}: ${row.machine_name}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

