import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function migrateDatabase() {
  try {
    console.log('Starting SQLite database migration...');
    
    // Initialize database directly
    const dbPath = path.resolve(__dirname, '../../erp_merchandiser.db');
    const db = new Database(dbPath);
    
    console.log('Connected to SQLite database at:', dbPath);
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Read the SQLite schema file
    const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the entire schema using exec()
    db.exec(schema);
    
    console.log('✅ SQLite database migration completed successfully!');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateDatabase();
