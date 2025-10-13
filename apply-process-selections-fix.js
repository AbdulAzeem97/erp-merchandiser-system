import pkg from 'pg';
import fs from 'fs';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function applyFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Applying Product Process Selections Fix...\n');
    
    // Read the SQL fix file
    const sql = fs.readFileSync('fix-product-process-selections-complete.sql', 'utf8');
    
    console.log('📝 Executing SQL migration...');
    await client.query(sql);
    
    console.log('✅ SQL migration completed successfully!\n');
    
    // Verify the fix
    console.log('🔍 Verifying tables...');
    
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('product_process_selections', 'product_step_selections')
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables found:');
    tablesCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Check columns
    const ppsColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_process_selections'
      ORDER BY ordinal_position;
    `);
    
    const pssColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_step_selections'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 product_process_selections columns:', ppsColumns.rows.length);
    console.log('   ', ppsColumns.rows.map(r => r.column_name).join(', '));
    
    console.log('\n📋 product_step_selections columns:', pssColumns.rows.length);
    console.log('   ', pssColumns.rows.map(r => r.column_name).join(', '));
    
    // Check indexes
    const indexes = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE tablename IN ('product_process_selections', 'product_step_selections')
      ORDER BY tablename, indexname;
    `);
    
    console.log('\n🔑 Indexes created:', indexes.rows.length);
    const ppsIndexes = indexes.rows.filter(r => r.tablename === 'product_process_selections');
    const pssIndexes = indexes.rows.filter(r => r.tablename === 'product_step_selections');
    
    console.log(`   ✓ product_process_selections: ${ppsIndexes.length} indexes`);
    console.log(`   ✓ product_step_selections: ${pssIndexes.length} indexes`);
    
    // Check triggers
    const triggers = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE event_object_table IN ('product_process_selections', 'product_step_selections')
      ORDER BY event_object_table;
    `);
    
    console.log('\n⚡ Triggers:');
    triggers.rows.forEach(row => {
      console.log(`   ✓ ${row.trigger_name} on ${row.event_object_table}`);
    });
    
    // Check foreign keys
    const fkeys = await client.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name IN ('product_process_selections', 'product_step_selections')
      ORDER BY tc.table_name, tc.constraint_name;
    `);
    
    console.log('\n🔗 Foreign Key Constraints:', fkeys.rows.length);
    const ppsFkeys = fkeys.rows.filter(r => r.table_name === 'product_process_selections');
    const pssFkeys = fkeys.rows.filter(r => r.table_name === 'product_step_selections');
    
    console.log(`   ✓ product_process_selections: ${ppsFkeys.length} constraints`);
    console.log(`   ✓ product_step_selections: ${pssFkeys.length} constraints`);
    
    // Count existing data
    const ppsCoun = await client.query('SELECT COUNT(*) FROM product_process_selections');
    const pssCount = await client.query('SELECT COUNT(*) FROM product_step_selections');
    
    console.log('\n📈 Current Data:');
    console.log(`   ✓ product_process_selections: ${ppsCoun.rows[0].count} rows`);
    console.log(`   ✓ product_step_selections: ${pssCount.rows[0].count} rows`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX APPLIED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📝 Next Steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Test creating a product with process selections');
    console.log('   3. Verify selections are saved in the database');
    console.log('\n💡 Check FIX-PROCESS-SELECTIONS-GUIDE.md for more details\n');
    
  } catch (error) {
    console.error('\n❌ Error applying fix:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
applyFix().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

