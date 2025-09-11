#!/usr/bin/env node

import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔐 Checking Admin Password');
console.log('='.repeat(50));

try {
  const dbPath = path.join(__dirname, 'erp_merchandiser.db');
  const db = sqlite3(dbPath);

  console.log('📊 Database connected successfully');
  
  // Get admin user
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@horizonsourcing.com');
  
  if (admin) {
    console.log('\n👑 Admin user found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.first_name} ${admin.last_name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password Hash: ${admin.password_hash}`);
    
    // Test password verification
    const testPasswords = ['password123', 'admin123', 'admin', 'password', 'Password123'];
    
    console.log('\n🧪 Testing password verification:');
    for (const password of testPasswords) {
      try {
        const isValid = await bcrypt.compare(password, admin.password_hash);
        console.log(`   ${password}: ${isValid ? '✅ VALID' : '❌ Invalid'}`);
        if (isValid) {
          console.log(`   🎉 CORRECT PASSWORD FOUND: ${password}`);
          break;
        }
      } catch (error) {
        console.log(`   ${password}: ❌ Error - ${error.message}`);
      }
    }
    
  } else {
    console.log('❌ Admin user not found');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}



