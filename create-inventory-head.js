import bcrypt from 'bcryptjs';
import pool from './server/database/sqlite-config.js';

async function createInventoryHead() {
  try {
    console.log('🔐 Creating Inventory Head user...');
    
    // Check existing users first
    const existingUsers = await pool.query('SELECT username, role FROM users');
    console.log('Existing users:', existingUsers);

    const inventoryPassword = await bcrypt.hash('inventory123', 10);
    
    // Create inventory head user
    await pool.query(`
      INSERT OR REPLACE INTO users (username, email, password_hash, first_name, last_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'inventory_head',
      'inventory@horizonsourcing.com', 
      inventoryPassword,
      'Inventory',
      'Manager',
      'INVENTORY_HEAD',
      1
    ]);

    console.log('✅ Inventory Head user created successfully!');
    console.log('');
    console.log('🔑 Inventory Head Login Credentials:');
    console.log('   Username: inventory_head');
    console.log('   Password: inventory123');
    console.log('   Email: inventory@horizonsourcing.com');
    
  } catch (error) {
    console.error('❌ Error creating inventory head:', error);
  }
  
  process.exit(0);
}

createInventoryHead();