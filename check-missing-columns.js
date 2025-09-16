import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkMissingColumns() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking products table columns...');

    // Get all columns in products table
    const columnsResult = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Current products table columns:');
    columnsResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
    });

    // Check for expected columns from the form and backend
    const expectedColumns = [
      'id', 'product_item_code', 'brand', 'material_id', 'gsm', 'product_type',
      'category_id', 'description', 'fsc', 'fsc_claim', 'color_specifications',
      'remarks', 'is_active', 'created_by', 'created_at', 'updated_at'
    ];

    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns:', missingColumns);
    } else {
      console.log('\n✅ All expected columns are present!');
    }

    // Check for extra columns that might cause issues
    const unexpectedColumns = existingColumns.filter(col => !expectedColumns.includes(col));
    if (unexpectedColumns.length > 0) {
      console.log('\n⚠️ Additional columns not in expected list:', unexpectedColumns);
    }

  } catch (error) {
    console.error('❌ Error checking columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkMissingColumns().catch(console.error);