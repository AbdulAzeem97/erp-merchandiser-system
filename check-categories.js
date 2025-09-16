import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkCategories() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking categories table...');

    // Check existing categories
    const categoriesResult = await client.query(`
      SELECT id, name, description, is_active
      FROM categories
      ORDER BY name;
    `);

    console.log('\n📊 Existing categories:');
    if (categoriesResult.rows.length === 0) {
      console.log('❌ No categories found! Adding sample categories...');

      // Insert sample categories
      const sampleCategories = [
        { id: '82d1039f-48ec-4a6a-a143-6388919c5f1e', name: 'Labels', description: 'Various types of labels' },
        { id: '91e1049f-48ec-4a6a-a143-6388919c5f2a', name: 'Packaging', description: 'Packaging materials' },
        { id: 'a1f1149f-48ec-4a6a-a143-6388919c5f3b', name: 'Textiles', description: 'Textile products' },
        { id: 'b2g2249f-48ec-4a6a-a143-6388919c5f4c', name: 'Print Media', description: 'Printed materials' }
      ];

      for (const category of sampleCategories) {
        await client.query(`
          INSERT INTO categories (id, name, description, is_active)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (id) DO NOTHING
        `, [category.id, category.name, category.description, true]);
        console.log(`✅ Added category: ${category.name}`);
      }
    } else {
      categoriesResult.rows.forEach(row => {
        console.log(`- ${row.name} (${row.id}) - Active: ${row.is_active}`);
      });
    }

    // Check updated categories
    const updatedResult = await client.query(`
      SELECT id, name, description, is_active
      FROM categories
      ORDER BY name;
    `);

    console.log(`\n📈 Total categories: ${updatedResult.rows.length}`);

  } catch (error) {
    console.error('❌ Error checking categories:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkCategories().catch(console.error);