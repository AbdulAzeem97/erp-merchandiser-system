import dbAdapter from './database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Initialize database adapter
  await dbAdapter.initialize();
  
  const client = await dbAdapter.getConnection().connect();
  try {
    console.log('🔄 Starting migrations 005 and 006...');
    
    // Read migration files
    const migration005Path = path.join(__dirname, 'database', 'migrations', '005_add_job_planning_step.sql');
    const migration006Path = path.join(__dirname, 'database', 'migrations', '006_make_prepress_steps_compulsory.sql');
    
    const migration005 = fs.readFileSync(migration005Path, 'utf8');
    const migration006 = fs.readFileSync(migration006Path, 'utf8');
    
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
    console.error('Error details:', error);
    throw error;
  } finally {
    client.release();
  }
}

runMigration()
  .then(() => {
    console.log('✅ Migration process completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed to run migrations:', error);
    console.error('Error stack:', error.stack);
    process.exit(1);
  });

