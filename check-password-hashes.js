#!/usr/bin/env node

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

console.log('🔐 Checking Password Hashes in Database');
console.log('='.repeat(45));

const db = new Database('erp_merchandiser.db');

try {
  // Get all users with their password hashes
  const users = db.prepare('SELECT id, username, email, first_name, last_name, role, password_hash FROM users').all();
  
  console.log(`Found ${users.length} users in database:`);
  console.log('');
  
  const testPassword = 'password123';
  
  for (const user of users) {
    console.log(`${user.first_name} ${user.last_name} (${user.role})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NULL'}`);
    
    if (user.password_hash) {
      try {
        const isValid = await bcrypt.compare(testPassword, user.password_hash);
        console.log(`   Password '${testPassword}' valid: ${isValid ? '✅ YES' : '❌ NO'}`);
      } catch (error) {
        console.log(`   Password check error: ${error.message}`);
      }
    } else {
      console.log(`   Password Hash: NULL`);
    }
    console.log('');
  }
  
} catch (error) {
  console.error('Error checking password hashes:', error.message);
} finally {
  db.close();
}
