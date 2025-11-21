import dbAdapter from './server/database/adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setDefaultOffsetSequence() {
  try {
    console.log('🔄 Setting up default Offset sequence for all products...');
    
    // Initialize database adapter
    await dbAdapter.initialize();
    console.log('✅ Database adapter initialized');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'server', 'database', 'migrations', '004_set_default_offset_sequence.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));
    
    for (const statement of statements) {
      try {
        if (statement.includes('DO $$')) {
          // Execute DO blocks as-is
          await dbAdapter.query(statement);
        } else if (statement.trim().length > 0) {
          await dbAdapter.query(statement);
        }
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && 
            !error.message.includes('duplicate') && 
            !error.message.includes('IF NOT EXISTS')) {
          console.error('❌ Error executing statement:', error.message);
          console.error('Statement:', statement.substring(0, 200));
        }
      }
    }
    
    console.log('✅ Default Offset sequence configured successfully!');
    
    // Verify the setup
    console.log('\n🔍 Verifying setup...');
    
    // Check Offset sequence
    const sequenceCheck = await dbAdapter.query(`
      SELECT id, name, description
      FROM process_sequences
      WHERE name = 'Offset' OR name LIKE 'Offset%'
      LIMIT 1
    `);
    
    if (sequenceCheck.rows.length > 0) {
      const sequence = sequenceCheck.rows[0];
      console.log(`✅ Found Offset sequence: ${sequence.name} (ID: ${sequence.id})`);
      
      // Check steps
      const stepsCheck = await dbAdapter.query(`
        SELECT "stepNumber", name, "isQualityCheck" as is_qa
        FROM process_steps
        WHERE "sequenceId" = $1
        ORDER BY "stepNumber" ASC
      `, [sequence.id]);
      
      console.log(`\n📋 Offset sequence steps (${stepsCheck.rows.length} total):`);
      stepsCheck.rows.forEach(step => {
        const qaFlag = step.is_qa ? ' [QA]' : '';
        const compulsoryFlag = step.stepNumber <= 4 ? ' [COMPULSORY]' : '';
        console.log(`   ${step.stepNumber}. ${step.name}${qaFlag}${compulsoryFlag}`);
      });
      
      // Check prepress steps specifically
      const prepressSteps = stepsCheck.rows.filter(s => 
        s.name.toLowerCase().includes('design') ||
        s.name.toLowerCase().includes('qa') ||
        s.name.toLowerCase().includes('ctp') ||
        s.name.toLowerCase().includes('plate')
      );
      
      console.log(`\n✅ Prepress steps (Design, QA, CTP): ${prepressSteps.length} found`);
      prepressSteps.forEach(step => {
        console.log(`   - ${step.name}`);
      });
    }
    
    // Check products with default sequence
    const productsCheck = await dbAdapter.query(`
      SELECT COUNT(*) as total_products
      FROM products
    `);
    
    const productsWithDefault = await dbAdapter.query(`
      SELECT COUNT(DISTINCT "productId") as products_with_default
      FROM product_process_selections
      WHERE "isDefault" = true
    `);
    
    console.log(`\n📊 Products: ${productsCheck.rows[0].total_products} total, ${productsWithDefault.rows[0].products_with_default} with default sequence`);
    
    if (parseInt(productsCheck.rows[0].total_products) > parseInt(productsWithDefault.rows[0].products_with_default)) {
      console.log(`⚠️  ${parseInt(productsCheck.rows[0].total_products) - parseInt(productsWithDefault.rows[0].products_with_default)} products still need default sequence`);
    } else {
      console.log('✅ All products have default sequence set!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting default Offset sequence:', error);
    process.exit(1);
  }
}

setDefaultOffsetSequence();

