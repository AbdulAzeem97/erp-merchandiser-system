#!/usr/bin/env node

import Database from 'better-sqlite3';

console.log('👥 Checking Users in Database');
console.log('='.repeat(40));

const db = new Database('erp_merchandiser.db');

try {
  // Get all users
  const users = db.prepare('SELECT id, username, email, first_name, last_name, role, is_active FROM users').all();
  
  console.log(`Found ${users.length} users in database:`);
  console.log('');
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
    console.log('');
  });
  
  // Check for Emma specifically
  const emma = db.prepare('SELECT * FROM users WHERE email = ?').get('emma.wilson@horizonsourcing.com');
  
  if (emma) {
    console.log('✅ Emma Wilson found in database');
    console.log(`   ID: ${emma.id}`);
    console.log(`   Email: ${emma.email}`);
    console.log(`   Role: ${emma.role}`);
    console.log(`   Active: ${emma.is_active ? 'Yes' : 'No'}`);
  } else {
    console.log('❌ Emma Wilson NOT found in database');
  }
  
} catch (error) {
  console.error('Error checking users:', error.message);
} finally {
  db.close();
}
