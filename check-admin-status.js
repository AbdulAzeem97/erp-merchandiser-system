#!/usr/bin/env node

import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('👑 Checking Admin User Status');
console.log('='.repeat(50));

try {
  const dbPath = path.join(__dirname, 'erp_merchandiser.db');
  const db = sqlite3(dbPath);

  console.log('📊 Database connected successfully');
  
  // Get admin user with all details
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@erp.local');
  
  if (admin) {
    console.log('\n👑 Admin user details:');
    Object.entries(admin).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    
    // Check if user is active
    console.log(`\n🔍 Is Active: ${admin.is_active === 1 ? '✅ YES' : '❌ NO'}`);
    
    // Test the exact query used in the backend
    const backendQuery = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = true').get('admin@erp.local');
    console.log(`\n🔍 Backend Query Result: ${backendQuery ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (!backendQuery) {
      console.log('❌ ISSUE FOUND: Backend query returns null!');
      console.log('   This means the user is not active or there\'s a data type issue');
      
      // Check what is_active values exist
      const activeValues = db.prepare('SELECT DISTINCT is_active FROM users').all();
      console.log('\n📊 All is_active values in database:');
      activeValues.forEach(row => {
        console.log(`   ${row.is_active} (type: ${typeof row.is_active})`);
      });
    }
    
  } else {
    console.log('❌ Admin user not found');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}



