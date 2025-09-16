import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 10000
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);

    const columns = result.rows.map(row => row.column_name);
    console.log('Products table columns:', columns);

    const expectedColumns = ['gsm', 'product_item_code', 'color_specifications'];
    const missingColumns = expectedColumns.filter(col => !columns.includes(col));

    if (missingColumns.length > 0) {
      console.log('Missing columns:', missingColumns);
    } else {
      console.log('All key columns present');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();