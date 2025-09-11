#!/usr/bin/env node

import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('👥 Checking Users Table Structure');
console.log('='.repeat(50));

try {
  const dbPath = path.join(__dirname, 'erp_merchandiser.db');
  const db = sqlite3(dbPath);

  console.log('📊 Database connected successfully');
  
  // Check table structure
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  
  console.log('\n📋 Users table structure:');
  tableInfo.forEach(column => {
    console.log(`   ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'}`);
  });
  
  // Get all users with available columns
  const users = db.prepare('SELECT * FROM users LIMIT 5').all();
  
  console.log(`\n👤 Sample users (${users.length} shown):`);
  if (users.length > 0) {
    console.log('Columns:', Object.keys(users[0]));
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      Object.entries(user).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    });
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Error:', error.message);
}



