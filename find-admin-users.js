#!/usr/bin/env node

import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('👑 Finding Admin Users');
console.log('='.repeat(50));

try {
  const dbPath = path.join(__dirname, 'erp_merchandiser.db');
  const db = sqlite3(dbPath);

  console.log('📊 Database connected successfully');
  
  // Get all users with ADMIN role
  const adminUsers = db.prepare('SELECT id, username, email, first_name, last_name, role, is_active FROM users WHERE role = ?').all('ADMIN');
  
  console.log(`\n👑 Users with ADMIN role: ${adminUsers.length}`);
  if (adminUsers.length > 0) {
    adminUsers.forEach(admin => {
      console.log(`   - ${admin.first_name} ${admin.last_name} (${admin.email}) - Username: ${admin.username}`);
    });
  } else {
    console.log('   ❌ No users found with ADMIN role');
  }
  
  // Get all users to see what roles exist
  const allRoles = db.prepare('SELECT DISTINCT role FROM users ORDER BY role').all();
  console.log(`\n📋 Available roles in system:`);
  allRoles.forEach(role => {
    console.log(`   - ${role.role}`);
  });
  
  // Check for users with admin-like emails or usernames
  const adminLikeUsers = db.prepare(`
    SELECT id, username, email, first_name, last_name, role, is_active 
    FROM users 
    WHERE email LIKE '%admin%' OR username LIKE '%admin%' OR first_name LIKE '%admin%' OR last_name LIKE '%admin%'
  `).all();
  
  console.log(`\n🔍 Users with admin-like names/emails: ${adminLikeUsers.length}`);
  if (adminLikeUsers.length > 0) {
    adminLikeUsers.forEach(user => {
      console.log(`   - ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`);
    });
  }
  
  // Show all users for reference
  const allUsers = db.prepare('SELECT username, email, first_name, last_name, role FROM users ORDER BY role, first_name').all();
  console.log(`\n👥 All users in system (${allUsers.length} total):`);
  console.log('-'.repeat(100));
  console.log('Username'.padEnd(20) + 'Email'.padEnd(35) + 'Name'.padEnd(25) + 'Role');
  console.log('-'.repeat(100));
  
  allUsers.forEach(user => {
    const username = (user.username || '').substring(0, 19);
    const email = (user.email || '').substring(0, 34);
    const name = `${user.first_name || ''} ${user.last_name || ''}`.substring(0, 24);
    const role = user.role || '';
    
    console.log(username.padEnd(20) + email.padEnd(35) + name.padEnd(25) + role);
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}



