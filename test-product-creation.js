#!/usr/bin/env node

import Database from 'better-sqlite3';

console.log('🧪 Testing Product Creation with Valid Data');
console.log('='.repeat(50));

const db = new Database('erp_merchandiser.db');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Get a valid material ID
  const materials = db.prepare('SELECT id, name, type FROM materials WHERE id IS NOT NULL LIMIT 1').all();
  const validMaterial = materials[0];
  
  // Get a valid category ID
  const categories = db.prepare('SELECT id, name FROM product_categories LIMIT 1').all();
  const validCategory = categories[0];
  
  console.log('📦 Using Material:');
  console.log(`   ID: ${validMaterial.id}`);
  console.log(`   Name: ${validMaterial.name}`);
  console.log(`   Type: ${validMaterial.type}`);
  console.log('');
  
  console.log('📂 Using Category:');
  console.log(`   ID: ${validCategory.id}`);
  console.log(`   Name: ${validCategory.name}`);
  console.log('');
  
  // Test product creation
  const testProduct = {
    product_item_code: 'TEST-001',
    brand: 'Test Brand',
    material_id: validMaterial.id,
    gsm: 200,
    product_type: 'Offset',
    category_id: validCategory.id,
    fsc: 'Yes',
    fsc_claim: 'Mixed',
    color_specifications: 'Black',
    remarks: 'Test product'
  };
  
  console.log('🧪 Testing Product Creation...');
  
  try {
    const insertStmt = db.prepare(`
      INSERT INTO products (
        id, product_item_code, brand, material_id, gsm, product_type, category_id,
        fsc, fsc_claim, color_specifications, remarks, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = insertStmt.run(
      'test-product-id-123',
      testProduct.product_item_code,
      testProduct.brand,
      testProduct.material_id,
      testProduct.gsm,
      testProduct.product_type,
      testProduct.category_id,
      testProduct.fsc,
      testProduct.fsc_claim,
      testProduct.color_specifications,
      testProduct.remarks,
      null // created_by
    );
    
    console.log('✅ Product creation successful!');
    console.log(`   Changes: ${result.changes}`);
    console.log(`   Last Insert Row ID: ${result.lastInsertRowid}`);
    
    // Clean up - delete the test product
    const deleteStmt = db.prepare('DELETE FROM products WHERE id = ?');
    deleteStmt.run('test-product-id-123');
    console.log('🧹 Test product cleaned up');
    
  } catch (error) {
    console.log('❌ Product creation failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
  }
  
  console.log('');
  console.log('🔍 Available Materials for Product Creation:');
  const allMaterials = db.prepare('SELECT id, name, type FROM materials WHERE id IS NOT NULL').all();
  allMaterials.forEach((material, index) => {
    console.log(`   ${index + 1}. ${material.name} (${material.type}) - ID: ${material.id}`);
  });
  
  console.log('');
  console.log('🔍 Available Categories for Product Creation:');
  const allCategories = db.prepare('SELECT id, name FROM product_categories').all();
  allCategories.forEach((category, index) => {
    console.log(`   ${index + 1}. ${category.name} - ID: ${category.id}`);
  });
  
} catch (error) {
  console.error('Error testing product creation:', error.message);
} finally {
  db.close();
}
