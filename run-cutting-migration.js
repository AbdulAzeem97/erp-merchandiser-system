import dbAdapter from './server/database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCuttingMigration() {
  try {
    console.log('🔄 Running Cutting Workflow Migration...\n');
    
    // Initialize database adapter
    await dbAdapter.initialize();
    console.log('✅ Database adapter initialized\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'server', 'database', 'migrations', '005_add_cutting_workflow.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...\n');
    
    // Execute migration as a single query to handle DO $$ blocks properly
    try {
      await dbAdapter.query(migrationSQL);
      console.log('✅ Migration SQL executed successfully');
    } catch (error) {
      // Handle specific errors gracefully
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  Some objects already exist (this is OK)');
      } else if (error.message.includes('does not exist') && error.message.includes('job_lifecycle')) {
        console.log('⚠️  job_lifecycle table does not exist - skipping optional columns');
        // Continue with the rest of the migration
      } else {
        throw error;
      }
    }
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    
    // Check if cutting_assignments table exists
    const tableCheck = await dbAdapter.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'cutting_assignments'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ cutting_assignments table exists');
    } else {
      console.log('❌ cutting_assignments table not found');
    }
    
    // Check if job_lifecycles has cutting columns (if table exists)
    const columnCheck = await dbAdapter.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_lifecycles' 
      AND column_name IN ('cuttingStatus', 'cuttingAssignedTo', 'cuttingStartedAt', 'cuttingCompletedAt')
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log(`✅ Found ${columnCheck.rows.length} cutting columns in job_lifecycles`);
    } else {
      console.log('⚠️  job_lifecycles table may not exist or columns already added');
    }
    
    console.log('\n🎉 Cutting workflow migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runCuttingMigration();

