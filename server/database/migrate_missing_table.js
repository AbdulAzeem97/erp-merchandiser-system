import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateMissingTable() {
  try {
    console.log('Adding missing product_process_selections table...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'add_product_process_selections.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migration);
    
    console.log('✅ Product process selections table created successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateMissingTable();