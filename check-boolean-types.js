import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkBooleanTypes() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking boolean column types...');

    // Check process_steps table column types
    const processStepsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'process_steps'
      AND column_name IN ('is_compulsory', 'is_active')
      ORDER BY column_name;
    `);

    console.log('\n📊 process_steps columns:');
    processStepsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check product_process_selections table column types
    const ppsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_process_selections'
      AND column_name = 'is_selected'
      ORDER BY column_name;
    `);

    console.log('\n📊 product_process_selections columns:');
    ppsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check actual values in process_steps
    const sampleValues = await client.query(`
      SELECT is_compulsory, is_active, COUNT(*) as count
      FROM process_steps
      GROUP BY is_compulsory, is_active
      ORDER BY is_compulsory, is_active;
    `);

    console.log('\n📊 Sample process_steps values:');
    sampleValues.rows.forEach(row => {
      console.log(`  is_compulsory: ${row.is_compulsory} (type: ${typeof row.is_compulsory}), is_active: ${row.is_active} (type: ${typeof row.is_active}), count: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkBooleanTypes().catch(console.error);