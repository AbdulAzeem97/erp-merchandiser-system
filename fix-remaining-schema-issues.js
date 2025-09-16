import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function fixRemainingSchemaIssues() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing remaining database schema issues...');

    // First, check what columns exist in the products table
    console.log('\n📋 Checking current products table structure:');
    const productsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY column_name;
    `);
    console.log('Products table columns:');
    productsColumns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Add missing product_item_code column
    console.log('\n🔧 Adding missing product_item_code column to products table...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS product_item_code VARCHAR(100);
    `);

    // Update existing products with generated product codes
    await client.query(`
      UPDATE products 
      SET product_item_code = 'PROD-' || LPAD(id::text, 6, '0') 
      WHERE product_item_code IS NULL;
    `);

    // Check job_cards table structure for recent activity queries
    console.log('\n📋 Checking job_cards table structure:');
    const jobCardsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' 
      ORDER BY column_name;
    `);
    console.log('Job_cards table columns:');
    jobCardsColumns.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });

    // Add missing columns to job_cards if needed
    console.log('\n🔧 Adding missing columns to job_cards table...');
    await client.query(`
      ALTER TABLE job_cards 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM',
      ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
    `);

    // Check if we need to add company_name column for easier queries
    await client.query(`
      ALTER TABLE job_cards 
      ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
    `);

    // Add indexes for performance
    console.log('\n🔧 Creating performance indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_item_code ON products(product_item_code);
      CREATE INDEX IF NOT EXISTS idx_job_cards_priority ON job_cards(priority);
      CREATE INDEX IF NOT EXISTS idx_job_cards_delivery_date ON job_cards(delivery_date);
      CREATE INDEX IF NOT EXISTS idx_job_cards_company ON job_cards(company_id);
    `);

    console.log('\n✅ Schema fixes completed successfully!');

    // Verify the changes
    console.log('\n📋 Verifying fixes:');
    
    const productItemCodeCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'product_item_code';
    `);
    console.log('Products product_item_code column:', productItemCodeCheck.rows[0] || 'NOT FOUND');

    const jobCardsPriorityCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' AND column_name = 'priority';
    `);
    console.log('Job_cards priority column:', jobCardsPriorityCheck.rows[0] || 'NOT FOUND');

  } catch (error) {
    console.error('❌ Error fixing schema issues:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await fixRemainingSchemaIssues();
    console.log('\n🎉 All schema issues fixed successfully!');
  } catch (error) {
    console.error('💥 Schema fix failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();