import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addMissingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding missing schema columns...');

    // Add is_active column to companies table
    console.log('Adding is_active column to companies table...');
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1;
    `);
    
    // Update existing companies to be active
    await client.query(`
      UPDATE companies SET is_active = 1 WHERE is_active IS NULL;
    `);

    // Add material_id column to products table
    console.log('Adding material_id column to products table...');
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS material_id VARCHAR(50);
    `);

    // Add job_card_id column to job_cards table if it doesn't exist
    console.log('Checking job_cards table structure...');
    const jobCardsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' 
      AND column_name = 'job_card_id';
    `);

    if (jobCardsColumns.rows.length === 0) {
      console.log('Adding job_card_id column to job_cards table...');
      await client.query(`
        ALTER TABLE job_cards 
        ADD COLUMN job_card_id VARCHAR(50) UNIQUE;
      `);
      
      // Generate job_card_id for existing records
      await client.query(`
        UPDATE job_cards 
        SET job_card_id = 'JC-' || LPAD(id::text, 6, '0') 
        WHERE job_card_id IS NULL;
      `);
    }

    // Add missing columns to prepress_jobs if needed
    console.log('Adding missing columns to prepress_jobs table...');
    await client.query(`
      ALTER TABLE prepress_jobs 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM',
      ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(4,2) DEFAULT 2.0,
      ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(4,2),
      ADD COLUMN IF NOT EXISTS complexity_score INTEGER DEFAULT 3;
    `);

    // Add missing columns to users table
    console.log('Adding missing columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(15),
      ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;
    `);

    // Add missing columns to job_lifecycle table (without foreign key for now)
    console.log('Adding missing columns to job_lifecycle table...');
    await client.query(`
      ALTER TABLE job_lifecycle 
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM',
      ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS actual_start_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS actual_end_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID,
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    // Create indexes for better performance
    console.log('Creating indexes for better performance...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_material ON products(material_id);
      CREATE INDEX IF NOT EXISTS idx_job_cards_job_id ON job_cards(job_card_id);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_prepress_priority ON prepress_jobs(priority);
    `);

    console.log('✅ Successfully added all missing schema columns!');
    
    // Verify the changes
    console.log('\n📋 Verifying changes:');
    
    const companiesCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'is_active';
    `);
    console.log('Companies is_active column:', companiesCheck.rows[0] || 'NOT FOUND');

    const productsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'material_id';
    `);
    console.log('Products material_id column:', productsCheck.rows[0] || 'NOT FOUND');

    const jobCardsCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' AND column_name = 'job_card_id';
    `);
    console.log('Job_cards job_card_id column:', jobCardsCheck.rows[0] || 'NOT FOUND');

  } catch (error) {
    console.error('❌ Error adding missing columns:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addMissingColumns();
    console.log('\n🎉 Schema update completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();