/**
 * Run production planning migration
 * Creates job_production_planning table
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function runMigration() {
  try {
    console.log('🔄 Running production planning migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'server', 'database', 'migrations', '002_add_production_planning_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 job_production_planning table created');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.log('⚠️  Table might already exist, continuing...');
    } else {
      await pool.end();
      process.exit(1);
    }
  }
}

runMigration();

