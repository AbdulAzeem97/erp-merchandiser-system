import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'erp_merchandiser',
  user: 'erp_user',
  password: 'secure_password_123',
});

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to products table...');
    
    // Add gsm column
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS gsm INTEGER;');
    console.log('✅ Added gsm column');
    
    // Add other missing columns that might be needed
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS fsc VARCHAR(50);');
    console.log('✅ Added fsc column');
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS fsc_claim VARCHAR(100);');
    console.log('✅ Added fsc_claim column');
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS color_specifications TEXT;');
    console.log('✅ Added color_specifications column');
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS remarks TEXT;');
    console.log('✅ Added remarks column');
    
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by UUID;');
    console.log('✅ Added created_by column');
    
    console.log('✅ All missing columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error.message);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
