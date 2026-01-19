import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbAdapter from './adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('🐘 Running PO number migrations...');

    // Migration 024: Add PO number flags
    console.log('📝 Running migration 024: Add PO number flags...');
    const migration024 = fs.readFileSync(
      path.join(__dirname, 'migrations', '024_add_po_number_flags.sql'),
      'utf8'
    );
    
    // Split and execute statements
    const statements024 = migration024.split(';').filter(stmt => stmt.trim());
    for (const statement of statements024) {
      if (statement.trim()) {
        try {
          await dbAdapter.query(statement.trim());
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('⚠️  Statement already applied (skipping):', statement.substring(0, 50) + '...');
          } else {
            throw error;
          }
        }
      }
    }
    console.log('✅ Migration 024 completed');

    // Migration 025: Migrate existing jobs
    console.log('📝 Running migration 025: Migrate existing jobs PO status...');
    const migration025 = fs.readFileSync(
      path.join(__dirname, 'migrations', '025_migrate_existing_jobs_po_status.sql'),
      'utf8'
    );
    
    const statements025 = migration025.split(';').filter(stmt => stmt.trim());
    for (const statement of statements025) {
      if (statement.trim()) {
        try {
          await dbAdapter.query(statement.trim());
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('⚠️  Statement already applied (skipping):', statement.substring(0, 50) + '...');
          } else {
            throw error;
          }
        }
      }
    }
    console.log('✅ Migration 025 completed');

    // Verify the changes
    console.log('🔍 Verifying migrations...');
    const result = await dbAdapter.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' 
      AND column_name IN ('without_po', 'po_required', 'po_provided_at', 'po_updated_by')
      ORDER BY column_name
    `);
    
    console.log('✅ Columns added:', result.rows.map(r => r.column_name).join(', '));

    // Check how many jobs are marked as without_po
    const withoutPOCount = await dbAdapter.query(`
      SELECT COUNT(*) as count FROM job_cards WHERE without_po = true
    `);
    console.log(`📊 Jobs without PO: ${withoutPOCount.rows[0].count}`);

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

