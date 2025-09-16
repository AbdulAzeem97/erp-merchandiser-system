import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addSampleCategories() {
  const client = await pool.connect();
  try {
    console.log('📋 Adding sample product categories...');

    // Sample categories data
    const categories = [
      {
        id: uuidv4(),
        name: 'Business Cards',
        description: 'Professional business cards and visiting cards',
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Brochures',
        description: 'Marketing brochures, flyers, and pamphlets',
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Banners & Signage',
        description: 'Large format printing, banners, and outdoor signage',
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Packaging',
        description: 'Product packaging, boxes, and cartons',
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Stationery',
        description: 'Letterheads, envelopes, and office stationery',
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Labels & Stickers',
        description: 'Product labels, stickers, and adhesive prints',
        is_active: true
      }
    ];

    // Insert categories
    for (const category of categories) {
      const insertQuery = `
        INSERT INTO categories (id, name, description, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `;

      await client.query(insertQuery, [
        category.id,
        category.name,
        category.description,
        category.is_active
      ]);

      console.log(`✅ Added category: ${category.name}`);
    }

    // Verify insertion
    const countResult = await client.query('SELECT COUNT(*) FROM categories WHERE is_active = true');
    console.log(`\n📊 Total active categories in database: ${countResult.rows[0].count}`);

    console.log('\n🎉 Sample categories added successfully!');

  } catch (error) {
    console.error('❌ Error adding sample categories:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addSampleCategories();