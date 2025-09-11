#!/usr/bin/env node

import Database from 'better-sqlite3';

console.log('🧹 Cleaning Up Categories Table - Removing Duplicates');
console.log('='.repeat(55));

const db = new Database('erp_merchandiser.db');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Get all categories
  const allCategories = db.prepare('SELECT * FROM product_categories').all();
  
  console.log(`Found ${allCategories.length} total categories:`);
  allCategories.forEach((category, index) => {
    console.log(`   ${index + 1}. ${category.name} - ID: ${category.id || 'NULL'}`);
  });
  console.log('');
  
  // Remove categories with null IDs (duplicates)
  const deleteNullIds = db.prepare('DELETE FROM product_categories WHERE id IS NULL');
  const result = deleteNullIds.run();
  
  console.log(`🗑️ Removed ${result.changes} categories with null IDs`);
  console.log('');
  
  // Verify remaining categories
  const remainingCategories = db.prepare('SELECT id, name FROM product_categories').all();
  
  console.log('📂 Remaining Categories:');
  remainingCategories.forEach((category, index) => {
    console.log(`   ${index + 1}. ${category.name} - ID: ${category.id}`);
  });
  
  console.log('');
  console.log(`✅ Categories cleanup complete! ${remainingCategories.length} categories remaining.`);
  
} catch (error) {
  console.error('Error cleaning up categories:', error.message);
} finally {
  db.close();
}
