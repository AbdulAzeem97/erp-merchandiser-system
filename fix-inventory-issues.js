import dbAdapter from './server/database/adapter.js';

async function fixInventoryIssues() {
  try {
    console.log('🔧 Fixing inventory issues...');
    
    // Check what columns exist in material_requests
    const materialRequestsColumns = await dbAdapter.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'material_requests' 
      ORDER BY ordinal_position
    `);
    
    console.log('material_requests columns:', materialRequestsColumns.rows.map(row => row.column_name));
    
    // Add missing columns to material_requests
    await dbAdapter.query('ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS material_name TEXT');
    console.log('✅ Added material_name column to material_requests');
    
    await dbAdapter.query('ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS unit TEXT');
    console.log('✅ Added unit column to material_requests');
    
    await dbAdapter.query('ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS notes TEXT');
    console.log('✅ Added notes column to material_requests');
    
    await dbAdapter.query('ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS created_by TEXT');
    console.log('✅ Added created_by column to material_requests');
    
    await dbAdapter.query('ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Added created_at column to material_requests');
    
    await dbAdapter.query('ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Added updated_at column to material_requests');
    
    // Check what columns exist in inventory_jobs
    const inventoryJobsColumns = await dbAdapter.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_jobs' 
      ORDER BY ordinal_position
    `);
    
    console.log('inventory_jobs columns:', inventoryJobsColumns.rows.map(row => row.column_name));
    
    // Add missing columns to inventory_jobs
    await dbAdapter.query('ALTER TABLE inventory_jobs ADD COLUMN IF NOT EXISTS priority TEXT');
    console.log('✅ Added priority column to inventory_jobs');
    
    await dbAdapter.query('ALTER TABLE inventory_jobs ADD COLUMN IF NOT EXISTS due_date TIMESTAMP');
    console.log('✅ Added due_date column to inventory_jobs');
    
    await dbAdapter.query('ALTER TABLE inventory_jobs ADD COLUMN IF NOT EXISTS created_by TEXT');
    console.log('✅ Added created_by column to inventory_jobs');
    
    await dbAdapter.query('ALTER TABLE inventory_jobs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Added created_at column to inventory_jobs');
    
    await dbAdapter.query('ALTER TABLE inventory_jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Added updated_at column to inventory_jobs');
    
    console.log('🎉 Inventory issues fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing inventory issues:', err.message);
    process.exit(1);
  }
}

fixInventoryIssues();
