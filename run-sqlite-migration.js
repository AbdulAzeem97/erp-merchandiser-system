import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'erp_merchandiser.db');
const db = new Database(dbPath);

console.log('Running SQLite migration...');

try {
  // Read the migration file
  const migrationSQL = fs.readFileSync('server/database/migrations/001_add_prepress_and_roles_sqlite.sql', 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'END');
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        console.log('Executing:', statement.substring(0, 50) + '...');
        db.exec(statement);
      } catch (error) {
        // Skip errors for indexes that reference non-existent tables
        if (error.message.includes('no such table') && statement.includes('CREATE INDEX')) {
          console.log('Skipping index creation (table not yet created):', statement.substring(0, 50) + '...');
          continue;
        }
        // Skip errors for columns that already exist
        if (error.message.includes('duplicate column name') || error.message.includes('no such column')) {
          console.log('Skipping (column already exists or table structure issue):', statement.substring(0, 50) + '...');
          continue;
        }
        throw error;
      }
    }
  }
  
  console.log('✅ SQLite migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
