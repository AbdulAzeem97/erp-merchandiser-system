import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
};

async function createInventorySchema() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'create-inventory-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Creating inventory management schema...');
    
    // Execute the schema creation
    await pool.query(schemaSQL);
    
    console.log('✅ Inventory management schema created successfully!');
    
    // Verify tables were created
    console.log('🔄 Verifying table creation...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'inventory_%'
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check views
    const viewsResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'v_%'
      ORDER BY table_name
    `);
    
    console.log('📈 Created views:');
    viewsResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Check triggers
    const triggersResult = await pool.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      AND trigger_name LIKE '%inventory%'
      ORDER BY trigger_name
    `);
    
    console.log('🔧 Created triggers:');
    triggersResult.rows.forEach(row => {
      console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
    });
    
    // Test sample data insertion
    console.log('🔄 Testing sample data insertion...');
    
    // Insert a sample item
    const sampleItemResult = await pool.query(`
      INSERT INTO inventory_items (item_code, item_name, unit, category_id, reorder_level, reorder_qty, unit_cost)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING item_id, item_code, item_name
    `, [
      'TEST-001',
      'Test Item - Flexo Ink Red',
      'LTR',
      1, // First category (Flexo Ink)
      10,
      50,
      25.50
    ]);
    
    console.log('✅ Sample item created:', sampleItemResult.rows[0]);
    
    // Insert a sample transaction
    const sampleTxnResult = await pool.query(`
      INSERT INTO inventory_transactions (item_id, location_id, txn_type, txn_date, qty, unit, ref_no, department, remarks, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING txn_id, txn_type, qty
    `, [
      sampleItemResult.rows[0].item_id,
      1, // Main Store
      'IN',
      new Date(),
      100,
      'LTR',
      'GRN-001',
      'Purchase',
      'Initial stock entry',
      'system'
    ]);
    
    console.log('✅ Sample transaction created:', sampleTxnResult.rows[0]);
    
    // Check if balance was auto-updated
    const balanceResult = await pool.query(`
      SELECT balance_qty, in_qty, out_qty, last_updated
      FROM inventory_balances 
      WHERE item_id = $1
    `, [sampleItemResult.rows[0].item_id]);
    
    if (balanceResult.rows.length > 0) {
      console.log('✅ Auto-balance update working:', balanceResult.rows[0]);
    } else {
      console.log('⚠️  Balance not auto-updated - check trigger');
    }
    
    // Test the views
    console.log('🔄 Testing views...');
    
    const itemWiseResult = await pool.query('SELECT COUNT(*) as count FROM v_item_wise_consolidated');
    console.log(`✅ Item-wise consolidated view: ${itemWiseResult.rows[0].count} records`);
    
    const categoryWiseResult = await pool.query('SELECT COUNT(*) as count FROM v_category_wise_summary');
    console.log(`✅ Category-wise summary view: ${categoryWiseResult.rows[0].count} records`);
    
    const reorderResult = await pool.query('SELECT COUNT(*) as count FROM v_reorder_alerts');
    console.log(`✅ Reorder alerts view: ${reorderResult.rows[0].count} records`);
    
    console.log('\n🎉 Inventory Management System Schema Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Create API endpoints for inventory operations');
    console.log('   2. Build frontend components for inventory management');
    console.log('   3. Integrate with existing job card system');
    console.log('   4. Set up reporting dashboards');
    console.log('   5. Configure reorder alerts and notifications');
    
  } catch (error) {
    console.error('❌ Error creating inventory schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the schema creation
if (import.meta.url === `file://${process.argv[1]}`) {
  createInventorySchema()
    .then(() => {
      console.log('✅ Schema creation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema creation failed:', error);
      process.exit(1);
    });
}

export { createInventorySchema };
