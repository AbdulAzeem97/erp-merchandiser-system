/**
 * Run all Smart Production Dashboard migrations
 * Creates material_sizes and job_production_planning tables
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'erp_user',
  password: 'DevPassword123!',
  host: 'localhost',
  database: 'erp_merchandiser',
  port: 5432
});

async function runMigrations() {
  try {
    console.log('🔄 Running Smart Production Dashboard migrations...\n');
    
    // Migration 1: Material Sizes
    console.log('📋 Running migration 1: material_sizes...');
    
    // Create material_sizes table directly
    await pool.query(`
      CREATE TABLE IF NOT EXISTS material_sizes (
        id SERIAL PRIMARY KEY,
        inventory_material_id INTEGER,
        size_name TEXT NOT NULL,
        width_mm DECIMAL(10,2) NOT NULL,
        height_mm DECIMAL(10,2) NOT NULL,
        unit_cost DECIMAL(10,2),
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(inventory_material_id, size_name)
      )
    `);
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_material_sizes_material_id ON material_sizes(inventory_material_id);
      CREATE INDEX IF NOT EXISTS idx_material_sizes_active ON material_sizes(is_active);
      CREATE INDEX IF NOT EXISTS idx_material_sizes_default ON material_sizes(is_default);
    `);
    
    console.log('✅ Migration 1 completed: material_sizes table created\n');
    
    // Migration 2: Production Planning
    console.log('📋 Running migration 2: job_production_planning...');
    const migration2Path = path.join(__dirname, 'server', 'database', 'migrations', '002_add_production_planning_fields.sql');
    const migration2SQL = fs.readFileSync(migration2Path, 'utf8');
    
    await pool.query(migration2SQL);
    console.log('✅ Migration 2 completed: job_production_planning table created\n');
    
    console.log('✅ All migrations completed successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.log('⚠️  Table might already exist, continuing...');
    } else {
      console.error('Full error:', error);
      await pool.end();
      process.exit(1);
    }
  }
}

runMigrations();

