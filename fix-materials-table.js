#!/usr/bin/env node

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

console.log('🔧 Fixing Materials Table - Adding Missing IDs');
console.log('='.repeat(50));

const db = new Database('erp_merchandiser.db');

try {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Get materials with null IDs
  const materialsWithNullIds = db.prepare('SELECT * FROM materials WHERE id IS NULL').all();
  
  console.log(`Found ${materialsWithNullIds.length} materials with null IDs:`);
  materialsWithNullIds.forEach(material => {
    console.log(`   - ${material.name} (${material.type})`);
  });
  console.log('');
  
  // Update materials with null IDs
  const updateMaterial = db.prepare('UPDATE materials SET id = ? WHERE name = ? AND type = ? AND id IS NULL');
  
  let updatedCount = 0;
  for (const material of materialsWithNullIds) {
    try {
      const newId = uuidv4();
      updateMaterial.run(newId, material.name, material.type);
      console.log(`✅ Updated ${material.name}: ${newId}`);
      updatedCount++;
    } catch (error) {
      console.log(`❌ Failed to update ${material.name}: ${error.message}`);
    }
  }
  
  console.log('');
  console.log(`📊 Materials Update Summary:`);
  console.log(`   Updated: ${updatedCount}/${materialsWithNullIds.length}`);
  console.log('');
  
  // Verify all materials now have IDs
  const allMaterials = db.prepare('SELECT id, name, type FROM materials').all();
  const materialsWithoutIds = allMaterials.filter(m => !m.id);
  
  console.log('📦 All Materials:');
  allMaterials.forEach(material => {
    console.log(`   ${material.id ? '✅' : '❌'} ${material.name} (${material.type}) - ID: ${material.id || 'NULL'}`);
  });
  
  if (materialsWithoutIds.length === 0) {
    console.log('');
    console.log('✅ All materials now have valid IDs!');
  } else {
    console.log('');
    console.log(`❌ ${materialsWithoutIds.length} materials still have null IDs`);
  }
  
} catch (error) {
  console.error('Error fixing materials table:', error.message);
} finally {
  db.close();
}
