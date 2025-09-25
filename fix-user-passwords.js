#!/usr/bin/env node

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

console.log('🔧 Fixing User Password Hashes');
console.log('='.repeat(40));

const db = new Database('erp_merchandiser.db');

async function fixPasswords() {
  try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Hash the correct password
    const correctPassword = 'password123';
    const hashedPassword = await bcrypt.hash(correctPassword, 10);
    
    console.log('🔐 Generated new password hash for "password123"');
    console.log('');
    
    // Get all users
    const users = db.prepare('SELECT id, email, first_name, last_name, role FROM users').all();
    
    console.log(`Found ${users.length} users to update:`);
    console.log('');
    
    // Update password for each user
    const updatePassword = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    
    let updatedCount = 0;
    for (const user of users) {
      try {
        updatePassword.run(hashedPassword, user.id);
        console.log(`✅ Updated password for ${user.first_name} ${user.last_name} (${user.role})`);
        updatedCount++;
      } catch (error) {
        console.log(`❌ Failed to update ${user.first_name} ${user.last_name}: ${error.message}`);
      }
    }
    
    console.log('');
    console.log(`📊 Password Update Summary:`);
    console.log(`   Total users: ${users.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Failed: ${users.length - updatedCount}`);
    console.log('');
    console.log('🔐 All users now have password: password123');
    console.log('');
    
    // Test a few logins
    console.log('🧪 Testing updated passwords...');
    
    const testUsers = [
      { email: 'emma.wilson@horizonsourcing.com', name: 'Emma Wilson' },
      { email: 'admin@erp.local', name: 'System Administrator' },
      { email: 'inventory@horizonsourcing.com', name: 'Inventory Manager' }
    ];
    
    for (const testUser of testUsers) {
      const user = db.prepare('SELECT password_hash FROM users WHERE email = ?').get(testUser.email);
      if (user) {
        const isValid = await bcrypt.compare(correctPassword, user.password_hash);
        console.log(`${isValid ? '✅' : '❌'} ${testUser.name}: ${isValid ? 'Password valid' : 'Password invalid'}`);
      }
    }
    
  } catch (error) {
    console.error('Error fixing passwords:', error.message);
  } finally {
    db.close();
  }
}

fixPasswords();
