import dbAdapter from './database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Starting database migrations...');

async function runMigration() {
  try {
    // Set correct database credentials
    process.env.DB_USER = process.env.DB_USER || 'erp_user';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'DevPassword123!';
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_NAME = process.env.DB_NAME || 'erp_merchandiser';
    process.env.DB_PORT = process.env.DB_PORT || '5432';
    
    // Initialize database adapter
    console.log('📡 Connecting to database...');
    await dbAdapter.initialize();
    console.log('✅ Database connected');
    
    // Read migration files
    const migration005Path = path.join(__dirname, 'database', 'migrations', '005_add_job_planning_step.sql');
    const migration006Path = path.join(__dirname, 'database', 'migrations', '006_make_prepress_steps_compulsory.sql');
    
    console.log('📖 Reading migration files...');
    const migration005 = fs.readFileSync(migration005Path, 'utf8');
    const migration006 = fs.readFileSync(migration006Path, 'utf8');
    
    const client = await dbAdapter.getConnection().connect();
    
    try {
      await client.query('BEGIN');
      console.log('📝 Running migration 005: Add Job Planning Step...');
      await client.query(migration005);
      console.log('✅ Migration 005 completed');
      
      console.log('📝 Running migration 006: Make Prepress Steps Compulsory...');
      await client.query(migration006);
      console.log('✅ Migration 006 completed');
      
      await client.query('COMMIT');
      console.log('✅ All migrations completed successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Migration error:', error.message);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    console.error('Error details:', error);
    throw error;
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migration process completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration process failed');
    process.exit(1);
  });

