import dbAdapter from './server/database/adapter.js';

async function checkCompaniesSchema() {
  try {
    const result = await dbAdapter.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position
    `);
    
    console.log('Companies table schema:');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkCompaniesSchema();
