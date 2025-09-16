import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkTables() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking process-related tables...');

    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%process%'
      ORDER BY table_name;
    `);

    console.log('\n📊 Process-related tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check process_steps table structure if it exists
    for (const table of tablesResult.rows) {
      console.log(`\n🏗️ Structure of ${table.table_name}:`);
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = '${table.table_name}'
        ORDER BY ordinal_position;
      `);

      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Check sample data
      const sampleResult = await client.query(`SELECT * FROM ${table.table_name} LIMIT 3;`);
      console.log(`\n📋 Sample data from ${table.table_name}:`);
      if (sampleResult.rows.length > 0) {
        console.log(JSON.stringify(sampleResult.rows, null, 2));
      } else {
        console.log('  No data found');
      }
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables().catch(console.error);