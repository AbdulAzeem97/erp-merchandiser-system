import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

console.log('🌱 Seeding PostgreSQL with clean data...');

const pool = new Pool({
  user: process.env.PG_USER || 'erp_user',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'erp_merchandiser',
  password: process.env.PG_PASSWORD || 'secure_password_123',
  port: process.env.PG_PORT || 5432,
});

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  const users = [
    {
      id: uuidv4(),
      username: 'admin',
      email: 'admin@erp.local',
      password: 'admin123',
      first_name: 'System',
      last_name: 'Administrator',
      role: 'ADMIN'
    },
    {
      id: uuidv4(),
      username: 'sarah.johnson',
      email: 'sarah.johnson@horizonsourcing.com',
      password: 'password123',
      first_name: 'Sarah',
      last_name: 'Johnson',
      role: 'HOD_PREPRESS'
    },
    {
      id: uuidv4(),
      username: 'emma.wilson',
      email: 'emma.wilson@horizonsourcing.com',
      password: 'password123',
      first_name: 'Emma',
      last_name: 'Wilson',
      role: 'DESIGNER'
    },
    {
      id: uuidv4(),
      username: 'john.doe',
      email: 'john.doe@horizonsourcing.com',
      password: 'password123',
      first_name: 'John',
      last_name: 'Doe',
      role: 'MERCHANDISER'
    },
    {
      id: uuidv4(),
      username: 'jane.smith',
      email: 'jane.smith@horizonsourcing.com',
      password: 'password123',
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'INVENTORY_MANAGER'
    }
  ];
  
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await pool.query(`
      INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (email) DO UPDATE SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = CURRENT_TIMESTAMP
    `, [
      user.id,
      user.username,
      user.email,
      hashedPassword,
      user.first_name,
      user.last_name,
      user.role
    ]);
  }
  
  console.log(`✅ Seeded ${users.length} users`);
}

async function seedCompanies() {
  console.log('🏢 Seeding companies...');
  
  const companies = [
    { name: 'Nike', code: 'NIKE' },
    { name: 'Adidas', code: 'ADIDAS' },
    { name: 'Puma', code: 'PUMA' },
    { name: 'Reebok', code: 'REEBOK' },
    { name: 'Under Armour', code: 'UA' }
  ];
  
  for (const company of companies) {
    await pool.query(`
      INSERT INTO companies (id, name, code, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        updated_at = CURRENT_TIMESTAMP
    `, [uuidv4(), company.name, company.code]);
  }
  
  console.log(`✅ Seeded ${companies.length} companies`);
}

async function seedMaterials() {
  console.log('📦 Seeding materials...');
  
  const materials = [
    { name: 'Cotton', code: 'COTTON', type: 'Fabric' },
    { name: 'Polyester', code: 'POLY', type: 'Fabric' },
    { name: 'Leather', code: 'LEATHER', type: 'Material' },
    { name: 'Canvas', code: 'CANVAS', type: 'Fabric' },
    { name: 'Mesh', code: 'MESH', type: 'Fabric' }
  ];
  
  for (const material of materials) {
    await pool.query(`
      INSERT INTO materials (id, name, code, type, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        type = EXCLUDED.type,
        updated_at = CURRENT_TIMESTAMP
    `, [uuidv4(), material.name, material.code, material.type]);
  }
  
  console.log(`✅ Seeded ${materials.length} materials`);
}

async function seedProductCategories() {
  console.log('📂 Seeding product categories...');
  
  const categories = [
    { name: 'T-Shirts', description: 'Cotton and synthetic t-shirts' },
    { name: 'Shoes', description: 'Athletic and casual footwear' },
    { name: 'Accessories', description: 'Bags, hats, and other accessories' },
    { name: 'Sportswear', description: 'Athletic and performance wear' }
  ];
  
  for (const category of categories) {
    await pool.query(`
      INSERT INTO product_categories (id, name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
    `, [uuidv4(), category.name, category.description]);
  }
  
  console.log(`✅ Seeded ${categories.length} product categories`);
}

async function seedProducts() {
  console.log('📦 Seeding products...');
  
  const products = [
    { code: 'NIKE-TS-001', brand: 'Nike', type: 'T-Shirt', category: 'T-Shirts', material: 'Cotton' },
    { code: 'ADIDAS-SH-001', brand: 'Adidas', type: 'Sneakers', category: 'Shoes', material: 'Canvas' },
    { code: 'PUMA-SW-001', brand: 'Puma', type: 'Hoodie', category: 'Sportswear', material: 'Polyester' },
    { code: 'REEBOK-AC-001', brand: 'Reebok', type: 'Cap', category: 'Accessories', material: 'Cotton' }
  ];
  
  for (const product of products) {
    // Get category and material IDs
    const categoryResult = await pool.query('SELECT id FROM product_categories WHERE name = $1', [product.category]);
    const materialResult = await pool.query('SELECT id FROM materials WHERE name = $1', [product.material]);
    
    const categoryId = categoryResult.rows[0]?.id;
    const materialId = materialResult.rows[0]?.id;
    
    await pool.query(`
      INSERT INTO products (id, product_item_code, brand, product_type, material_id, category_id, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (product_item_code) DO UPDATE SET
        brand = EXCLUDED.brand,
        product_type = EXCLUDED.product_type,
        material_id = EXCLUDED.material_id,
        category_id = EXCLUDED.category_id,
        updated_at = CURRENT_TIMESTAMP
    `, [uuidv4(), product.code, product.brand, product.type, materialId, categoryId]);
  }
  
  console.log(`✅ Seeded ${products.length} products`);
}

async function seedJobCards() {
  console.log('📋 Seeding job cards...');
  
  // Get sample data
  const companies = await pool.query('SELECT id FROM companies LIMIT 3');
  const products = await pool.query('SELECT id FROM products LIMIT 3');
  const users = await pool.query('SELECT id FROM users WHERE role = $1', ['MERCHANDISER']);
  
  if (companies.rows.length === 0 || products.rows.length === 0 || users.rows.length === 0) {
    console.log('⚠️ Skipping job cards - missing required data');
    return;
  }
  
  const jobCards = [
    { job_card_id: 'JC-001', company_id: companies.rows[0].id, product_id: products.rows[0].id, quantity: 100, priority: 'MEDIUM', status: 'PENDING' },
    { job_card_id: 'JC-002', company_id: companies.rows[1].id, product_id: products.rows[1].id, quantity: 200, priority: 'HIGH', status: 'IN_PROGRESS' },
    { job_card_id: 'JC-003', company_id: companies.rows[2].id, product_id: products.rows[2].id, quantity: 50, priority: 'LOW', status: 'COMPLETED' }
  ];
  
  for (const jobCard of jobCards) {
    await pool.query(`
      INSERT INTO job_cards (id, job_card_id, company_id, product_id, quantity, priority, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (job_card_id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        product_id = EXCLUDED.product_id,
        quantity = EXCLUDED.quantity,
        priority = EXCLUDED.priority,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    `, [uuidv4(), jobCard.job_card_id, jobCard.company_id, jobCard.product_id, jobCard.quantity, jobCard.priority, jobCard.status, users.rows[0].id]);
  }
  
  console.log(`✅ Seeded ${jobCards.length} job cards`);
}

async function seedPrepressJobs() {
  console.log('🎨 Seeding prepress jobs...');
  
  const jobCards = await pool.query('SELECT job_card_id FROM job_cards LIMIT 3');
  const designers = await pool.query('SELECT id FROM users WHERE role = $1', ['DESIGNER']);
  
  if (jobCards.rows.length === 0 || designers.rows.length === 0) {
    console.log('⚠️ Skipping prepress jobs - missing required data');
    return;
  }
  
  const prepressJobs = [
    { job_card_id: jobCards.rows[0].job_card_id, assigned_designer_id: designers.rows[0].id, status: 'PENDING', priority: 'MEDIUM' },
    { job_card_id: jobCards.rows[1].job_card_id, assigned_designer_id: designers.rows[0].id, status: 'IN_PROGRESS', priority: 'HIGH' },
    { job_card_id: jobCards.rows[2].job_card_id, assigned_designer_id: designers.rows[0].id, status: 'COMPLETED', priority: 'LOW' }
  ];
  
  for (const prepressJob of prepressJobs) {
    await pool.query(`
      INSERT INTO prepress_jobs (id, job_card_id, assigned_designer_id, status, priority, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (job_card_id) DO UPDATE SET
        assigned_designer_id = EXCLUDED.assigned_designer_id,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        updated_at = CURRENT_TIMESTAMP
    `, [uuidv4(), prepressJob.job_card_id, prepressJob.assigned_designer_id, prepressJob.status, prepressJob.priority]);
  }
  
  console.log(`✅ Seeded ${prepressJobs.length} prepress jobs`);
}

async function seedJobLifecycle() {
  console.log('🔄 Seeding job lifecycle...');
  
  const jobCards = await pool.query('SELECT job_card_id FROM job_cards LIMIT 3');
  const prepressJobs = await pool.query('SELECT id FROM prepress_jobs LIMIT 3');
  
  if (jobCards.rows.length === 0 || prepressJobs.rows.length === 0) {
    console.log('⚠️ Skipping job lifecycle - missing required data');
    return;
  }
  
  const lifecycleEntries = [
    { job_card_id: jobCards.rows[0].job_card_id, prepress_job_id: prepressJobs.rows[0].id, current_stage: 'DESIGN', status: 'PENDING' },
    { job_card_id: jobCards.rows[1].job_card_id, prepress_job_id: prepressJobs.rows[1].id, current_stage: 'PREPRESS', status: 'IN_PROGRESS' },
    { job_card_id: jobCards.rows[2].job_card_id, prepress_job_id: prepressJobs.rows[2].id, current_stage: 'COMPLETED', status: 'COMPLETED' }
  ];
  
  for (const entry of lifecycleEntries) {
    await pool.query(`
      INSERT INTO job_lifecycle (id, job_card_id, prepress_job_id, current_stage, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (job_card_id) DO UPDATE SET
        prepress_job_id = EXCLUDED.prepress_job_id,
        current_stage = EXCLUDED.current_stage,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    `, [uuidv4(), entry.job_card_id, entry.prepress_job_id, entry.current_stage, entry.status]);
  }
  
  console.log(`✅ Seeded ${lifecycleEntries.length} lifecycle entries`);
}

async function runSeed() {
  try {
    console.log('🚀 Starting PostgreSQL seed...');
    
    await seedUsers();
    await seedCompanies();
    await seedMaterials();
    await seedProductCategories();
    await seedProducts();
    await seedJobCards();
    await seedPrepressJobs();
    await seedJobLifecycle();
    
    console.log('🎉 PostgreSQL seed completed successfully!');
    
    // Verify the seed
    const tables = ['users', 'companies', 'materials', 'product_categories', 'products', 'job_cards', 'prepress_jobs', 'job_lifecycle'];
    
    console.log('🔍 Verifying seed...');
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table}: ${result.rows[0].count} records`);
    }
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await pool.end();
  }
}

runSeed();
