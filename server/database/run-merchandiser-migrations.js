import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dbAdapter from './adapter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('🐘 Running merchandiser-specific migrations...');

    // Migration 026: Add product creator tracking
    console.log('📝 Running migration 026: Add product creator tracking...');
    const migration026 = fs.readFileSync(
      path.join(__dirname, 'migrations', '026_add_product_creator_tracking.sql'),
      'utf8'
    );
    
    const statements026 = migration026.split(';').filter(stmt => stmt.trim());
    for (const statement of statements026) {
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
    console.log('✅ Migration 026 completed');

    // Migration 027: Add job creator index
    console.log('📝 Running migration 027: Add job creator index...');
    const migration027 = fs.readFileSync(
      path.join(__dirname, 'migrations', '027_add_job_creator_index.sql'),
      'utf8'
    );
    
    const statements027 = migration027.split(';').filter(stmt => stmt.trim());
    for (const statement of statements027) {
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
    console.log('✅ Migration 027 completed');

    // Verify the changes
    console.log('🔍 Verifying migrations...');
    const productColumnCheck = await dbAdapter.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'createdById'
    `);
    
    if (productColumnCheck.rows.length > 0) {
      console.log('✅ Products table: createdById column added');
    } else {
      console.log('⚠️  Products table: createdById column not found');
    }

    const jobIndexCheck = await dbAdapter.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'job_cards' 
      AND indexname = 'idx_job_cards_created_by'
    `);
    
    if (jobIndexCheck.rows.length > 0) {
      console.log('✅ Job cards table: createdById index added');
    } else {
      console.log('⚠️  Job cards table: createdById index not found');
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();

