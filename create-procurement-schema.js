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

async function createProcurementSchema() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'create-procurement-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Creating procurement management schema...');
    
    // Execute the schema creation
    await pool.query(schemaSQL);
    
    console.log('✅ Procurement management schema created successfully!');
    
    // Verify tables were created
    console.log('🔄 Verifying table creation...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('suppliers', 'supplier_items', 'purchase_requisitions', 'purchase_requisition_items', 'purchase_orders', 'purchase_order_items', 'goods_receipt_notes', 'grn_items', 'invoices', 'procurement_report_config')
      ORDER BY table_name
    `);
    
    console.log('📊 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    // Test sample data insertion
    console.log('🔄 Testing sample data insertion...');
    
    // Insert a sample purchase requisition
    const sampleReqResult = await pool.query(`
      INSERT INTO purchase_requisitions (requisition_number, requested_by, department, requisition_date, priority, status, justification)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING requisition_id, requisition_number
    `, [
      'REQ-2024-001',
      'John Doe',
      'Production',
      new Date(),
      'HIGH',
      'SUBMITTED',
      'Urgent requirement for production materials'
    ]);
    
    console.log('✅ Sample requisition created:', sampleReqResult.rows[0]);
    
    // Insert a sample purchase order
    const samplePOResult = await pool.query(`
      INSERT INTO purchase_orders (po_number, supplier_id, requisition_id, po_date, expected_delivery_date, status, subtotal, total_amount, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING po_id, po_number
    `, [
      'PO-2024-001',
      1, // First supplier
      sampleReqResult.rows[0].requisition_id,
      new Date(),
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      'SENT',
      1000.00,
      1000.00,
      'system'
    ]);
    
    console.log('✅ Sample purchase order created:', samplePOResult.rows[0]);
    
    // Check suppliers count
    const suppliersResult = await pool.query('SELECT COUNT(*) as count FROM suppliers');
    console.log(`✅ Suppliers count: ${suppliersResult.rows[0].count}`);
    
    console.log('\n🎉 Procurement Management System Schema Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Create API endpoints for procurement operations');
    console.log('   2. Build frontend components for procurement management');
    console.log('   3. Integrate with inventory system');
    console.log('   4. Set up approval workflows');
    console.log('   5. Configure supplier management');
    
  } catch (error) {
    console.error('❌ Error creating procurement schema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the schema creation
if (import.meta.url === `file://${process.argv[1]}`) {
  createProcurementSchema()
    .then(() => {
      console.log('✅ Procurement schema creation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Procurement schema creation failed:', error);
      process.exit(1);
    });
}

export { createProcurementSchema };
