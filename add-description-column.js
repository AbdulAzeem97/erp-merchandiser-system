import { Pool } from 'pg';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addDescriptionColumn() {
  const client = await pool.connect();
  try {
    console.log('📋 Adding description column to process_sequences...');

    // Add description column
    await client.query(`
      ALTER TABLE process_sequences 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    // Update with sample descriptions
    await client.query(`
      UPDATE process_sequences 
      SET description = 'Complete workflow for ' || sequence_name 
      WHERE description IS NULL;
    `);

    console.log('✅ Added description column and updated values');

  } catch (error) {
    console.error('❌ Error adding description column:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addDescriptionColumn();