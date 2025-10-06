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

async function createSimpleInventorySchema() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Read the simple SQL schema file
    const schemaPath = path.join(__dirname, 'create-inventory-schema-simple.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Creating simple inventory management schema...');
    
    // Execute the schema creation
    await pool.query(schemaSQL);
    
    console.log('✅ Simple inventory management schema created successfully!');
    
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
    
    // Manually update balance (since we don't have triggers yet)
    await pool.query(`
      INSERT INTO inventory_balances (item_id, location_id, balance_qty, in_qty, unit_cost, total_value, last_txn_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (item_id, location_id)
      DO UPDATE SET
        balance_qty = inventory_balances.balance_qty + $3,
        in_qty = inventory_balances.in_qty + $4,
        total_value = inventory_balances.total_value + $6,
        last_txn_date = $7,
        last_updated = CURRENT_TIMESTAMP
    `, [
      sampleItemResult.rows[0].item_id,
      1,
      100,
      100,
      25.50,
      2550.00,
      new Date()
    ]);
    
    console.log('✅ Balance updated manually');
    
    // Check the balance
    const balanceResult = await pool.query(`
      SELECT balance_qty, in_qty, total_value
      FROM inventory_balances 
      WHERE item_id = $1
    `, [sampleItemResult.rows[0].item_id]);
    
    if (balanceResult.rows.length > 0) {
      console.log('✅ Balance verification:', balanceResult.rows[0]);
    }
    
    console.log('\n🎉 Simple Inventory Management System Schema Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test the inventory API endpoints');
    console.log('   2. Add triggers for auto-balance updates');
    console.log('   3. Create frontend components');
    console.log('   4. Integrate with job card system');
    
  } catch (error) {
    console.error('❌ Error creating simple inventory schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the schema creation
if (import.meta.url === `file://${process.argv[1]}`) {
  createSimpleInventorySchema()
    .then(() => {
      console.log('✅ Simple schema creation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Simple schema creation failed:', error);
      process.exit(1);
    });
}

export { createSimpleInventorySchema };
