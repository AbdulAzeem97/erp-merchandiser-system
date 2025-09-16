import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addMissingCategory() {
  const client = await pool.connect();

  try {
    console.log('➕ Adding the missing category ID...');

    // Add the specific category ID that the form is trying to use
    await client.query(`
      INSERT INTO categories (id, name, description, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, ['82d1039f-48ec-4a6a-a143-6388919c5f1e', 'General Products', 'General product category', true]);

    console.log('✅ Added missing category: 82d1039f-48ec-4a6a-a143-6388919c5f1e');

    // Verify it was added
    const result = await client.query(`
      SELECT id, name
      FROM categories
      WHERE id = '82d1039f-48ec-4a6a-a143-6388919c5f1e'
    `);

    if (result.rows.length > 0) {
      console.log(`✅ Category verified: ${result.rows[0].name}`);
    }

  } catch (error) {
    console.error('❌ Error adding category:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingCategory().catch(console.error);