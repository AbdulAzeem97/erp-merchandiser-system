import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addGsmColumn() {
  const client = await pool.connect();
  try {
    console.log('📋 Adding gsm column to products table...');

    // Add gsm column to products table
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS gsm VARCHAR(255);
    `);
    
    console.log('✅ Added gsm column to products table');

    // Check for other potentially missing columns that might be needed
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Current products table columns:');
    structureResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n🎉 GSM column added successfully!');

  } catch (error) {
    console.error('❌ Error adding gsm column:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addGsmColumn();