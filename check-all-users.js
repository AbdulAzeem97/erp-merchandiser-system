#!/usr/bin/env node

import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('👥 Checking All Users in Database');
console.log('='.repeat(50));

try {
  const dbPath = path.join(__dirname, 'erp_merchandiser.db');
  const db = sqlite3(dbPath);

  console.log('📊 Database connected successfully');
  
  // Get all users
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY role, name').all();
  
  console.log(`\n👤 Found ${users.length} users:`);
  console.log('-'.repeat(80));
  console.log('ID'.padEnd(40) + 'Name'.padEnd(25) + 'Email'.padEnd(35) + 'Role');
  console.log('-'.repeat(80));
  
  users.forEach(user => {
    const id = user.id.substring(0, 8) + '...';
    const name = (user.name || 'N/A').substring(0, 24);
    const email = (user.email || 'N/A').substring(0, 34);
    const role = user.role || 'N/A';
    
    console.log(id.padEnd(40) + name.padEnd(25) + email.padEnd(35) + role);
  });
  
  // Check for admin users specifically
  const adminUsers = users.filter(user => 
    user.role === 'ADMIN' || 
    user.email?.toLowerCase().includes('admin') ||
    user.name?.toLowerCase().includes('admin')
  );
  
  console.log(`\n👑 Admin users found: ${adminUsers.length}`);
  if (adminUsers.length > 0) {
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email}) - Role: ${admin.role}`);
    });
  }
  
  // Check for users with ADMIN role specifically
  const actualAdminRole = users.filter(user => user.role === 'ADMIN');
  console.log(`\n🔐 Users with ADMIN role: ${actualAdminRole.length}`);
  if (actualAdminRole.length > 0) {
    actualAdminRole.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
  } else {
    console.log('   ❌ No users found with ADMIN role');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
