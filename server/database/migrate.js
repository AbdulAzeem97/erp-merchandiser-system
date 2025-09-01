import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateDatabase() {
  try {
    console.log('Starting PostgreSQL database migration...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ PostgreSQL database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateDatabase();
