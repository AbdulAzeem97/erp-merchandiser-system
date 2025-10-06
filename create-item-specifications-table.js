import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function createItemSpecificationsTable() {
  const client = await pool.connect();
  try {
    console.log('📋 Creating item_specifications table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-item-specifications-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✅ item_specifications table created successfully!');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'item_specifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating item_specifications table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createItemSpecificationsTable().catch(console.error);
