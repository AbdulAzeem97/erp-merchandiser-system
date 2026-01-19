/**
 * Seed additional material records required by the product form.
 * This script is safe to re-run; it only inserts records that are missing.
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'erp_merchandiser',
  user: process.env.PG_USER || 'erp_user',
  password: process.env.PG_PASSWORD || 'DevPassword123!',
});

const materialsToEnsure = [
  {
    name: 'Metsaboard Natural',
    unit: 'pcs',
    description: 'Metsaboard Natural board',
    costPerUnit: 0,
  },
  {
    name: 'Ivory Card Pindo',
    unit: 'pcs',
    description: 'Ivory Card Pindo board',
    costPerUnit: 0,
  },
  {
    name: 'Ivory Card',
    unit: 'pcs',
    description: 'Ivory Card board',
    costPerUnit: 0,
  },
  {
    name: 'Fancy Card',
    unit: 'pcs',
    description: 'Fancy Card standard',
    costPerUnit: 0,
  },
  {
    name: 'Fancy Card Textured',
    unit: 'pcs',
    description: 'Fancy Card Textured board',
    costPerUnit: 0,
  },
  {
    name: 'Art Card',
    unit: 'pcs',
    description: 'Art Card board',
    costPerUnit: 0,
  },
];

async function ensureMaterial(material) {
  const client = await pool.connect();
  try {
    const existing = await client.query(
      'SELECT id, name FROM materials WHERE LOWER(name) = LOWER($1)',
      [material.name],
    );

    if (existing.rowCount > 0) {
      const row = existing.rows[0];
      console.log(`✅ Material already exists: ${row.name} (id: ${row.id})`);
      return;
    }

    const insertQuery = `
      INSERT INTO materials (name, description, unit, "costPerUnit", "isActive", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING id
    `;

    const result = await client.query(insertQuery, [
      material.name,
      material.description,
      material.unit,
      material.costPerUnit,
    ]);

    console.log(`🆕 Inserted material: ${material.name} (id: ${result.rows[0].id})`);
  } catch (error) {
    console.error(`❌ Failed to ensure material "${material.name}":`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('🔄 Seeding additional materials...');
  try {
    for (const material of materialsToEnsure) {
      await ensureMaterial(material);
    }
    console.log('✅ Material seeding completed successfully.');
  } catch (error) {
    console.error('❌ Material seeding encountered an error:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();


