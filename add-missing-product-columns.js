import pkg from 'pg';
const { Pool } = pkg;

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
    console.log('🔍 Adding missing product columns...');

    // Check existing columns
    const checkColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('color_specifications', 'remarks', 'created_by')
      ORDER BY column_name;
    `);

    const existingColumns = checkColumns.rows.map(row => row.column_name);
    console.log('Existing special columns:', existingColumns);

    // Add color_specifications column if it doesn't exist
    if (!existingColumns.includes('color_specifications')) {
      console.log('➕ Adding color_specifications column...');
      await client.query(`
        ALTER TABLE products
        ADD COLUMN color_specifications TEXT;
      `);
      console.log('✅ Added color_specifications column');
    } else {
      console.log('ℹ️ color_specifications column already exists');
    }

    // Add remarks column if it doesn't exist
    if (!existingColumns.includes('remarks')) {
      console.log('➕ Adding remarks column...');
      await client.query(`
        ALTER TABLE products
        ADD COLUMN remarks TEXT;
      `);
      console.log('✅ Added remarks column');
    } else {
      console.log('ℹ️ remarks column already exists');
    }

    // Add created_by column if it doesn't exist
    if (!existingColumns.includes('created_by')) {
      console.log('➕ Adding created_by column...');
      await client.query(`
        ALTER TABLE products
        ADD COLUMN created_by UUID REFERENCES users(id);
      `);
      console.log('✅ Added created_by column');
    } else {
      console.log('ℹ️ created_by column already exists');
    }

    // Verify the changes
    const verifyColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('color_specifications', 'remarks', 'created_by')
      ORDER BY column_name;
    `);

    console.log('\n📊 Updated products table columns:');
    verifyColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    console.log('\n🎉 Missing product columns added successfully!');

  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingColumns().catch(console.error);