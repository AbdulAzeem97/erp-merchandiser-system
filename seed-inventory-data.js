import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
};

async function seedInventoryData() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🔄 Clearing existing inventory data...');
    await pool.query('DELETE FROM inventory_transactions');
    await pool.query('DELETE FROM inventory_balances');
    await pool.query('DELETE FROM inventory_items');
    console.log('✅ Existing data cleared');

    // Insert sample inventory items
    console.log('🔄 Inserting sample inventory items...');
    
    const sampleItems = [
      // Printing Inks
      { code: 'INK-FLX-RED-001', name: 'Flexo Ink - Red (Pantone 186C)', unit: 'LTR', category: 1, reorder_level: 5, reorder_qty: 20, cost: 45.50 },
      { code: 'INK-FLX-BLUE-002', name: 'Flexo Ink - Blue (Pantone 286C)', unit: 'LTR', category: 1, reorder_level: 5, reorder_qty: 20, cost: 48.75 },
      { code: 'INK-FLX-BLACK-003', name: 'Flexo Ink - Black (Process Black)', unit: 'LTR', category: 1, reorder_level: 8, reorder_qty: 25, cost: 42.00 },
      { code: 'INK-SCR-YELLOW-004', name: 'Screen Ink - Yellow (Pantone 116C)', unit: 'LTR', category: 2, reorder_level: 3, reorder_qty: 15, cost: 52.25 },
      { code: 'INK-OFF-CYAN-005', name: 'Offset Ink - Cyan (Process Cyan)', unit: 'LTR', category: 3, reorder_level: 4, reorder_qty: 18, cost: 55.80 },
      { code: 'INK-DIG-MAGENTA-006', name: 'Digital Ink - Magenta (Process Magenta)', unit: 'LTR', category: 4, reorder_level: 2, reorder_qty: 12, cost: 68.90 },
      
      // Packing Materials
      { code: 'BOX-CORR-001', name: 'Corrugated Box - Small (12x8x6 inches)', unit: 'PCS', category: 5, reorder_level: 100, reorder_qty: 500, cost: 2.50 },
      { code: 'BOX-CORR-002', name: 'Corrugated Box - Medium (18x12x10 inches)', unit: 'PCS', category: 5, reorder_level: 80, reorder_qty: 400, cost: 4.25 },
      { code: 'BOX-CORR-003', name: 'Corrugated Box - Large (24x18x12 inches)', unit: 'PCS', category: 5, reorder_level: 60, reorder_qty: 300, cost: 6.75 },
      { code: 'BAG-POLY-001', name: 'Polyethylene Bag - Small (8x12 inches)', unit: 'PCS', category: 6, reorder_level: 500, reorder_qty: 2000, cost: 0.15 },
      { code: 'BAG-PAPER-002', name: 'Paper Bag - Medium (10x15 inches)', unit: 'PCS', category: 6, reorder_level: 300, reorder_qty: 1500, cost: 0.35 },
      { code: 'LABEL-GLOSS-001', name: 'Glossy Label - 2x4 inches', unit: 'PCS', category: 7, reorder_level: 1000, reorder_qty: 5000, cost: 0.08 },
      { code: 'LABEL-MATT-002', name: 'Matte Label - 3x5 inches', unit: 'PCS', category: 7, reorder_level: 800, reorder_qty: 4000, cost: 0.12 },
      
      // CTP Materials
      { code: 'PLATE-CTP-001', name: 'CTP Plate - 8x10 inches', unit: 'PCS', category: 8, reorder_level: 50, reorder_qty: 200, cost: 12.50 },
      { code: 'PLATE-CTP-002', name: 'CTP Plate - 11x17 inches', unit: 'PCS', category: 8, reorder_level: 40, reorder_qty: 150, cost: 18.75 },
      { code: 'CHEM-DEV-001', name: 'CTP Developer Solution', unit: 'LTR', category: 9, reorder_level: 10, reorder_qty: 50, cost: 25.00 },
      { code: 'CHEM-FIN-002', name: 'CTP Finisher Solution', unit: 'LTR', category: 9, reorder_level: 8, reorder_qty: 40, cost: 22.50 },
      
      // Raw Materials
      { code: 'PAPER-A4-001', name: 'A4 Paper - 80 GSM White', unit: 'REAMS', category: 10, reorder_level: 20, reorder_qty: 100, cost: 8.50 },
      { code: 'PAPER-A3-002', name: 'A3 Paper - 100 GSM White', unit: 'REAMS', category: 10, reorder_level: 15, reorder_qty: 75, cost: 12.25 },
      { code: 'BOARD-300GSM-001', name: 'Cardboard - 300 GSM White', unit: 'SHEETS', category: 11, reorder_level: 100, reorder_qty: 500, cost: 0.45 },
      { code: 'BOARD-400GSM-002', name: 'Cardboard - 400 GSM Brown', unit: 'SHEETS', category: 11, reorder_level: 80, reorder_qty: 400, cost: 0.65 }
    ];

    for (const item of sampleItems) {
      await pool.query(`
        INSERT INTO inventory_items (item_code, item_name, unit, category_id, reorder_level, reorder_qty, unit_cost)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [item.code, item.name, item.unit, item.category, item.reorder_level, item.reorder_qty, item.cost]);
    }
    
    console.log(`✅ Inserted ${sampleItems.length} inventory items`);

    // Insert sample transactions (opening balances and some movements)
    console.log('🔄 Inserting sample transactions...');
    
    const items = await pool.query('SELECT item_id, item_code, unit_cost FROM inventory_items ORDER BY item_id');
    
    for (let i = 0; i < items.rows.length; i++) {
      const item = items.rows[i];
      const locationId = (i % 5) + 1; // Distribute across 5 locations
      
      // Opening balance transaction
      const openingQty = Math.floor(Math.random() * 200) + 50; // Random quantity between 50-250
      
      await pool.query(`
        INSERT INTO inventory_transactions (
          item_id, location_id, txn_type, txn_date, qty, unit, 
          ref_no, department, remarks, unit_cost, total_value, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        item.item_id,
        locationId,
        'OPENING_BALANCE',
        new Date('2024-01-01'),
        openingQty,
        'PCS', // Default unit for opening balance
        'OB-2024-001',
        'Store',
        'Opening balance for 2024',
        item.unit_cost,
        openingQty * item.unit_cost,
        'system'
      ]);
      
      // Add some random transactions for the last 30 days
      const transactionCount = Math.floor(Math.random() * 5) + 1; // 1-5 transactions per item
      
      for (let j = 0; j < transactionCount; j++) {
        const txnDate = new Date();
        txnDate.setDate(txnDate.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
        
        const txnTypes = ['IN', 'OUT'];
        const txnType = txnTypes[Math.floor(Math.random() * txnTypes.length)];
        const qty = Math.floor(Math.random() * 50) + 5; // Random quantity 5-55
        
        const departments = ['Purchase', 'Production', 'Quality Control', 'CTP'];
        const department = departments[Math.floor(Math.random() * departments.length)];
        
        const refNo = txnType === 'IN' ? 
          `GRN-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}` :
          `ISS-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
        
        await pool.query(`
          INSERT INTO inventory_transactions (
            item_id, location_id, txn_type, txn_date, qty, unit, 
            ref_no, department, remarks, unit_cost, total_value, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          item.item_id,
          locationId,
          txnType,
          txnDate,
          qty,
          'PCS',
          refNo,
          department,
          `${txnType === 'IN' ? 'Goods received' : 'Material issued'} for ${department}`,
          item.unit_cost,
          qty * item.unit_cost,
          'system'
        ]);
      }
    }
    
    console.log('✅ Sample transactions inserted');

    // Verify the data
    console.log('🔄 Verifying data...');
    
    const itemCount = await pool.query('SELECT COUNT(*) as count FROM inventory_items');
    const txnCount = await pool.query('SELECT COUNT(*) as count FROM inventory_transactions');
    const balanceCount = await pool.query('SELECT COUNT(*) as count FROM inventory_balances');
    
    console.log(`📊 Data Summary:`);
    console.log(`   - Items: ${itemCount.rows[0].count}`);
    console.log(`   - Transactions: ${txnCount.rows[0].count}`);
    console.log(`   - Balances: ${balanceCount.rows[0].count}`);
    
    // Show some sample data
    console.log('\n📋 Sample Items:');
    const sampleItemsResult = await pool.query(`
      SELECT i.item_code, i.item_name, i.unit, c.department, c.master_category, c.control_category,
             COALESCE(ib.balance_qty, 0) as balance_qty, COALESCE(ib.total_value, 0) as total_value
      FROM inventory_items i
      LEFT JOIN inventory_categories c ON i.category_id = c.category_id
      LEFT JOIN inventory_balances ib ON i.item_id = ib.item_id
      ORDER BY i.item_id
      LIMIT 5
    `);
    
    sampleItemsResult.rows.forEach(item => {
      const totalValue = parseFloat(item.total_value) || 0;
      console.log(`   - ${item.item_code}: ${item.item_name} (${item.balance_qty} ${item.unit}) - $${totalValue.toFixed(2)}`);
    });
    
    // Show reorder alerts (simplified query without views)
    console.log('\n⚠️  Reorder Alerts:');
    const reorderResult = await pool.query(`
      SELECT 
        i.item_code, 
        i.item_name, 
        COALESCE(ib.balance_qty, 0) as current_stock, 
        i.reorder_level,
        CASE 
          WHEN COALESCE(ib.balance_qty, 0) <= i.reorder_level THEN 'REORDER_REQUIRED'
          WHEN COALESCE(ib.balance_qty, 0) <= (i.reorder_level * 1.5) THEN 'LOW_STOCK'
          ELSE 'OK'
        END as stock_status
      FROM inventory_items i
      LEFT JOIN inventory_balances ib ON i.item_id = ib.item_id
      WHERE i.is_active = TRUE 
      AND COALESCE(ib.balance_qty, 0) <= (i.reorder_level * 1.5)
      LIMIT 5
    `);
    
    if (reorderResult.rows.length > 0) {
      reorderResult.rows.forEach(item => {
        console.log(`   - ${item.item_code}: ${item.current_stock}/${item.reorder_level} (${item.stock_status})`);
      });
    } else {
      console.log('   - No reorder alerts at this time');
    }
    
    console.log('\n🎉 Inventory data seeding completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Test the inventory API endpoints');
    console.log('   2. Create frontend inventory management interface');
    console.log('   3. Set up automated reorder notifications');
    console.log('   4. Integrate with job card system for material consumption');
    
  } catch (error) {
    console.error('❌ Error seeding inventory data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seeding
if (import.meta.url === `file://${process.argv[1]}`) {
  seedInventoryData()
    .then(() => {
      console.log('✅ Data seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data seeding failed:', error);
      process.exit(1);
    });
}

export { seedInventoryData };
