#!/usr/bin/env node

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

console.log('🔧 Fixing Categories Table - Adding Missing IDs');
console.log('='.repeat(50));

const db = new Database('erp_merchandiser.db');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Get categories with null IDs
  const categoriesWithNullIds = db.prepare('SELECT * FROM product_categories WHERE id IS NULL').all();
  
  console.log(`Found ${categoriesWithNullIds.length} categories with null IDs:`);
  categoriesWithNullIds.forEach(category => {
    console.log(`   - ${category.name}`);
  });
  console.log('');
  
  // Update categories with null IDs
  const updateCategory = db.prepare('UPDATE product_categories SET id = ? WHERE name = ? AND id IS NULL');
  
  let updatedCount = 0;
  for (const category of categoriesWithNullIds) {
    try {
      const newId = uuidv4();
      updateCategory.run(newId, category.name);
      console.log(`✅ Updated ${category.name}: ${newId}`);
      updatedCount++;
    } catch (error) {
      console.log(`❌ Failed to update ${category.name}: ${error.message}`);
    }
  }
  
  console.log('');
  console.log(`📊 Categories Update Summary:`);
  console.log(`   Updated: ${updatedCount}/${categoriesWithNullIds.length}`);
  console.log('');
  
  // Verify all categories now have IDs
  const allCategories = db.prepare('SELECT id, name FROM product_categories').all();
  const categoriesWithoutIds = allCategories.filter(c => !c.id);
  
  console.log('📂 All Categories:');
  allCategories.forEach(category => {
    console.log(`   ${category.id ? '✅' : '❌'} ${category.name} - ID: ${category.id || 'NULL'}`);
  });
  
  if (categoriesWithoutIds.length === 0) {
    console.log('');
    console.log('✅ All categories now have valid IDs!');
  } else {
    console.log('');
    console.log(`❌ ${categoriesWithoutIds.length} categories still have null IDs`);
  }
  
} catch (error) {
  console.error('Error fixing categories table:', error.message);
} finally {
  db.close();
}
