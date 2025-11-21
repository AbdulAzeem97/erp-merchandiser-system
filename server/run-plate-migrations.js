import dbAdapter from './database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🔄 Starting plate info migrations...');
  
  // Set correct database credentials
  process.env.DB_USER = process.env.DB_USER || 'erp_user';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'DevPassword123!';
  process.env.DB_HOST = process.env.DB_HOST || 'localhost';
  process.env.DB_NAME = process.env.DB_NAME || 'erp_merchandiser';
  process.env.DB_PORT = process.env.DB_PORT || '5432';
  
  // Initialize database adapter
  await dbAdapter.initialize();
  
  const client = await dbAdapter.getConnection().connect();
  try {
    console.log('📝 Running migration 007: Add job_ctp_machines table...');
    const migration007Path = path.join(__dirname, 'database', 'migrations', '007_add_job_ctp_machines_table.sql');
    const migration007 = fs.readFileSync(migration007Path, 'utf8');
    await client.query(migration007);
    console.log('✅ Migration 007 completed');
    
    console.log('📝 Running migration 008: Update CTP machines with names...');
    const migration008Path = path.join(__dirname, 'database', 'migrations', '008_update_ctp_machines_with_names.sql');
    const migration008 = fs.readFileSync(migration008Path, 'utf8');
    await client.query(migration008);
    console.log('✅ Migration 008 completed');
    
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    client.release();
  }
}

runMigrations()
  .then(() => {
    console.log('✅ Migration process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to run migrations:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  });

