import dbAdapter from './server/database/adapter.js';

async function checkProductsTable() {
  try {
    const result = await dbAdapter.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    
    console.log('Products table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Also check a few sample product IDs
    const sampleProducts = await dbAdapter.query(`
      SELECT id, name FROM products LIMIT 5
    `);
    
    console.log('\nSample product IDs:');
    sampleProducts.rows.forEach(row => {
      console.log(`  ID: ${row.id} (type: ${typeof row.id}), Name: ${row.name}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkProductsTable();

