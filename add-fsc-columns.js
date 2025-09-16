import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addFscColumns() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking if FSC columns exist...');

    // Check if columns exist
    const checkColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('fsc', 'fsc_claim')
      ORDER BY column_name;
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('Existing FSC columns:', existingColumns);

    // Add FSC column if it doesn't exist
    if (!existingColumns.includes('fsc')) {
      console.log('➕ Adding fsc column...');
      await client.query(`
        ALTER TABLE products
        ADD COLUMN fsc VARCHAR(3) DEFAULT 'No' CHECK (fsc IN ('Yes', 'No'));
      `);
      console.log('✅ Added fsc column');
    } else {
      console.log('ℹ️ fsc column already exists');
    }

    // Add FSC claim column if it doesn't exist
    if (!existingColumns.includes('fsc_claim')) {
      console.log('➕ Adding fsc_claim column...');
      await client.query(`
        ALTER TABLE products
        ADD COLUMN fsc_claim VARCHAR(20) CHECK (fsc_claim IN ('Recycled', 'Mixed', ''));
      `);
      console.log('✅ Added fsc_claim column');
    } else {
      console.log('ℹ️ fsc_claim column already exists');
    }

    // Verify the changes
    const verifyColumns = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('fsc', 'fsc_claim')
      ORDER BY column_name;
    `);

    console.log('\n📊 Updated products table FSC columns:');
    verifyColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
    });

    console.log('\n🎉 FSC columns added successfully!');

  } catch (error) {
    console.error('❌ Error adding FSC columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addFscColumns().catch(console.error);