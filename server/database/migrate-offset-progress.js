import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbAdapter from './adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('🚀 Running Offset Printing progress tracking migrations...\n');

    const migrations = [
      path.join(__dirname, 'migrations', '009_add_offset_printing_progress.sql'),
      path.join(__dirname, 'migrations', '010_add_offset_printing_daily_summary.sql'),
      path.join(__dirname, 'migrations', '011_enhance_offset_assignments.sql')
    ];

    for (const migrationPath of migrations) {
      if (fs.existsSync(migrationPath)) {
        console.log(`📄 Running: ${path.basename(migrationPath)}`);
        const sql = fs.readFileSync(migrationPath, 'utf8');
        try {
          await dbAdapter.query(sql);
          console.log(`✅ Completed: ${path.basename(migrationPath)}\n`);
        } catch (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('does not exist')) {
            console.log(`⚠️  Already applied or skipped: ${path.basename(migrationPath)}\n`);
          } else {
            throw error;
          }
        }
      } else {
        console.log(`⚠️  File not found: ${migrationPath}\n`);
      }
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigrations();



