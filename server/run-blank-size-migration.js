import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'erp_merchandiser',
  user: process.env.DB_USER || 'erp_user',
  password: process.env.DB_PASSWORD || 'DevPassword123!'
});

async function runMigration() {
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'database/migrations/009_add_blank_size_to_prepress.sql'),
      'utf8'
    );
    
    console.log('🔄 Running migration 009_add_blank_size_to_prepress.sql...');
    await pool.query(migrationSQL);
    console.log('✅ Migration 009 completed successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

