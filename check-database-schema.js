#!/usr/bin/env node

import Database from 'better-sqlite3';

console.log('🔍 Checking Database Schema for Foreign Key Issues');
console.log('='.repeat(55));

const db = new Database('erp_merchandiser.db');

try {
  // Check if foreign keys are enabled
  const fkStatus = db.prepare('PRAGMA foreign_keys').get();
  console.log(`Foreign Keys Enabled: ${fkStatus.foreign_keys ? '✅ YES' : '❌ NO'}`);
  console.log('');

  // Check materials table
  console.log('📦 Materials Table:');
  const materials = db.prepare('SELECT id, name, material_type FROM materials LIMIT 5').all();
  console.log(`   Total materials: ${materials.length}`);
  if (materials.length > 0) {
    materials.forEach(material => {
      console.log(`   - ${material.name} (${material.material_type}) - ID: ${material.id}`);
    });
  } else {
    console.log('   ❌ No materials found!');
  }
  console.log('');

  // Check categories table
  console.log('📂 Categories Table:');
  const categories = db.prepare('SELECT id, name, description FROM product_categories LIMIT 5').all();
  console.log(`   Total categories: ${categories.length}`);
  if (categories.length > 0) {
    categories.forEach(category => {
      console.log(`   - ${category.name} - ID: ${category.id}`);
    });
  } else {
    console.log('   ❌ No categories found!');
  }
  console.log('');

  // Check products table structure
  console.log('📋 Products Table Structure:');
  const productSchema = db.prepare('PRAGMA table_info(products)').all();
  productSchema.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
  });
  console.log('');

  // Check foreign key constraints
  console.log('🔗 Foreign Key Constraints:');
  const fkConstraints = db.prepare('PRAGMA foreign_key_list(products)').all();
  if (fkConstraints.length > 0) {
    fkConstraints.forEach(fk => {
      console.log(`   ${fk.from} -> ${fk.table}.${fk.to}`);
    });
  } else {
    console.log('   No foreign key constraints found');
  }
  console.log('');

  // Check if the specific IDs from the error exist
  console.log('🔍 Checking Specific IDs from Error:');
  const materialId = '2432d810-ff09-489e-b52d-0e473053f09b';
  const categoryId = 'bfbcfcd8-46ec-4abb-b4b6-74c755db7fed';
  
  const material = db.prepare('SELECT id, name FROM materials WHERE id = ?').get(materialId);
  const category = db.prepare('SELECT id, name FROM product_categories WHERE id = ?').get(categoryId);
  
  console.log(`   Material ID ${materialId}: ${material ? `✅ Found (${material.name})` : '❌ Not found'}`);
  console.log(`   Category ID ${categoryId}: ${category ? `✅ Found (${category.name})` : '❌ Not found'}`);
  console.log('');

} catch (error) {
  console.error('Error checking database schema:', error.message);
} finally {
  db.close();
}
