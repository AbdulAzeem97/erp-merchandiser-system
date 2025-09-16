import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addSampleMaterials() {
  const client = await pool.connect();
  try {
    console.log('📋 Adding sample materials to database...');

    // Sample materials data
    const materials = [
      {
        id: uuidv4(),
        name: 'Art Paper',
        code: 'ART-001',
        unit: 'GSM',
        cost_per_unit: 25.50,
        current_stock: 1000,
        minimum_stock: 100,
        specifications: JSON.stringify({ 
          type: 'Coated Paper', 
          finish: 'Glossy',
          weight_range: '80-350 GSM'
        }),
        supplier_info: JSON.stringify({
          supplier: 'Paper Mills Ltd',
          contact: '+1-555-0123'
        }),
        category_id: null,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Maplitho Paper',
        code: 'MAP-001',
        unit: 'GSM',
        cost_per_unit: 18.75,
        current_stock: 800,
        minimum_stock: 80,
        specifications: JSON.stringify({ 
          type: 'Uncoated Paper', 
          finish: 'Matte',
          weight_range: '50-120 GSM'
        }),
        supplier_info: JSON.stringify({
          supplier: 'Quality Papers Inc',
          contact: '+1-555-0456'
        }),
        category_id: null,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Cardboard',
        code: 'CARD-001',
        unit: 'GSM',
        cost_per_unit: 45.00,
        current_stock: 500,
        minimum_stock: 50,
        specifications: JSON.stringify({ 
          type: 'Rigid Board', 
          finish: 'Natural',
          weight_range: '200-400 GSM'
        }),
        supplier_info: JSON.stringify({
          supplier: 'Board Solutions',
          contact: '+1-555-0789'
        }),
        category_id: null,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Kraft Paper',
        code: 'KRAFT-001',
        unit: 'GSM',
        cost_per_unit: 15.25,
        current_stock: 1200,
        minimum_stock: 120,
        specifications: JSON.stringify({ 
          type: 'Recycled Paper', 
          finish: 'Natural Brown',
          weight_range: '70-200 GSM'
        }),
        supplier_info: JSON.stringify({
          supplier: 'Eco Papers Co',
          contact: '+1-555-0321'
        }),
        category_id: null,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Vinyl Sticker',
        code: 'VINYL-001',
        unit: 'SQM',
        cost_per_unit: 85.00,
        current_stock: 200,
        minimum_stock: 20,
        specifications: JSON.stringify({ 
          type: 'Self Adhesive', 
          finish: 'Glossy/Matte',
          durability: 'Outdoor 5 years'
        }),
        supplier_info: JSON.stringify({
          supplier: 'Adhesive Materials Ltd',
          contact: '+1-555-0654'
        }),
        category_id: null,
        is_active: true
      },
      {
        id: uuidv4(),
        name: 'Foam Board',
        code: 'FOAM-001',
        unit: 'SQM',
        cost_per_unit: 95.50,
        current_stock: 150,
        minimum_stock: 15,
        specifications: JSON.stringify({ 
          type: 'PVC Foam', 
          thickness: '3-10mm',
          density: 'Light Weight'
        }),
        supplier_info: JSON.stringify({
          supplier: 'Display Materials Inc',
          contact: '+1-555-0987'
        }),
        category_id: null,
        is_active: true
      }
    ];

    // Insert materials
    for (const material of materials) {
      const insertQuery = `
        INSERT INTO materials (
          id, name, code, unit, cost_per_unit, current_stock, 
          minimum_stock, specifications, supplier_info, category_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `;

      await client.query(insertQuery, [
        material.id,
        material.name,
        material.code,
        material.unit,
        material.cost_per_unit,
        material.current_stock,
        material.minimum_stock,
        material.specifications,
        material.supplier_info,
        material.category_id,
        material.is_active
      ]);

      console.log(`✅ Added material: ${material.name} (${material.code})`);
    }

    // Verify insertion
    const countResult = await client.query('SELECT COUNT(*) FROM materials WHERE is_active = true');
    console.log(`\n📊 Total active materials in database: ${countResult.rows[0].count}`);

    console.log('\n🎉 Sample materials added successfully!');

  } catch (error) {
    console.error('❌ Error adding sample materials:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addSampleMaterials();