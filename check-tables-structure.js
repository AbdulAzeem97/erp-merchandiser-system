#!/usr/bin/env node

import Database from 'better-sqlite3';

console.log('🔍 Checking Database Tables Structure');
console.log('='.repeat(45));

const db = new Database('erp_merchandiser.db');

try {
  // Check materials table structure
  console.log('📦 Materials Table Structure:');
  const materialSchema = db.prepare('PRAGMA table_info(materials)').all();
  materialSchema.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
  });
  console.log('');

  // Check materials data
  console.log('📦 Materials Data:');
  const materials = db.prepare('SELECT * FROM materials LIMIT 5').all();
  console.log(`   Total materials: ${materials.length}`);
  if (materials.length > 0) {
    materials.forEach(material => {
      console.log(`   - ID: ${material.id}`);
      console.log(`     Name: ${material.name || 'N/A'}`);
      console.log(`     Type: ${material.type || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('   ❌ No materials found!');
  }

  // Check categories table structure
  console.log('📂 Categories Table Structure:');
  const categorySchema = db.prepare('PRAGMA table_info(product_categories)').all();
  categorySchema.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
  });
  console.log('');

  // Check categories data
  console.log('📂 Categories Data:');
  const categories = db.prepare('SELECT * FROM product_categories LIMIT 5').all();
  console.log(`   Total categories: ${categories.length}`);
  if (categories.length > 0) {
    categories.forEach(category => {
      console.log(`   - ID: ${category.id}`);
      console.log(`     Name: ${category.name || 'N/A'}`);
      console.log(`     Description: ${category.description || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('   ❌ No categories found!');
  }

  // Check products table structure
  console.log('📋 Products Table Structure:');
  const productSchema = db.prepare('PRAGMA table_info(products)').all();
  productSchema.forEach(column => {
    console.log(`   ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
  });
  console.log('');

  // Check foreign key constraints for products
  console.log('🔗 Products Foreign Key Constraints:');
  const fkConstraints = db.prepare('PRAGMA foreign_key_list(products)').all();
  if (fkConstraints.length > 0) {
    fkConstraints.forEach(fk => {
      console.log(`   ${fk.from} -> ${fk.table}.${fk.to}`);
    });
  } else {
    console.log('   No foreign key constraints found');
  }
  console.log('');

} catch (error) {
  console.error('Error checking database structure:', error.message);
} finally {
  db.close();
}
