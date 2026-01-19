import dbAdapter from './adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixSequence() {
  try {
    console.log('🔧 Fixing products sequence...');
    
    const migrationPath = path.join(__dirname, 'migrations', '017_fix_products_sequence.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await dbAdapter.query(sql);
    
    // Verify the fix
    const checkResult = await dbAdapter.query(`
      SELECT 
        (SELECT MAX(id) FROM products) as max_id,
        (SELECT last_value FROM products_id_seq) as sequence_value
    `);
    
    const { max_id, sequence_value } = checkResult.rows[0];
    console.log(`✅ Sequence fixed: Max ID = ${max_id}, Sequence = ${sequence_value}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fix sequence:', error);
    process.exit(1);
  }
}

fixSequence();

