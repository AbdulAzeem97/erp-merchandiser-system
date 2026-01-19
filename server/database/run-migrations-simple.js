import dbAdapter from './adapter.js';

async function runMigrations() {
  try {
    console.log('🐘 Running migrations...');

    // Migration 026: Add product creator tracking
    console.log('📝 Adding createdById to products table...');
    try {
      await dbAdapter.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS "createdById" INTEGER REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ createdById column added to products');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log('⚠️  createdById column already exists');
      } else {
        throw error;
      }
    }

    // Create index for products
    try {
      await dbAdapter.query(`
        CREATE INDEX IF NOT EXISTS idx_products_created_by ON products("createdById")
      `);
      console.log('✅ Index created for products.createdById');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Index already exists');
      } else {
        throw error;
      }
    }

    // Migration 027: Add job creator index
    console.log('📝 Adding index for job_cards.createdById...');
    try {
      await dbAdapter.query(`
        CREATE INDEX IF NOT EXISTS idx_job_cards_created_by ON job_cards("createdById")
      `);
      console.log('✅ Index created for job_cards.createdById');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Index already exists');
      } else {
        throw error;
      }
    }

    // Verify
    console.log('🔍 Verifying migrations...');
    const productCheck = await dbAdapter.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'createdById'
    `);
    
    if (productCheck.rows.length > 0) {
      console.log('✅ Products table: createdById column exists');
    }

    const jobIndexCheck = await dbAdapter.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'job_cards' 
      AND indexname = 'idx_job_cards_created_by'
    `);
    
    if (jobIndexCheck.rows.length > 0) {
      console.log('✅ Job cards: createdById index exists');
    }

    console.log('✅ All migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigrations();

