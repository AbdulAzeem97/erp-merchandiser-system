import { Pool } from 'pg';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

console.log('=== DATA MIGRATION TO POSTGRESQL ===');
console.log('🚀 Starting data migration...');

// PostgreSQL connection
const pgPool = new Pool({
  user: process.env.PG_USER || 'erp_user',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'erp_merchandiser',
  password: process.env.PG_PASSWORD || 'secure_password_123',
  port: process.env.PG_PORT || 5432,
});

// SQLite connection
const sqliteDb = new Database('erp_merchandiser.db');

async function migrateUsers() {
  console.log('👥 Migrating users...');
  
  const users = sqliteDb.prepare('SELECT * FROM users').all();
  let migrated = 0;
  
  for (const user of users) {
    try {
      await pgPool.query(`
        INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
        user.id,
        user.username,
        user.email,
        user.password_hash,
        user.first_name,
        user.last_name,
        user.role,
        user.is_active,
        user.created_at,
        user.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating user ${user.email}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} users`);
}

async function migrateCompanies() {
  console.log('🏢 Migrating companies...');
  
  const companies = sqliteDb.prepare('SELECT * FROM companies').all();
  let migrated = 0;
  
  for (const company of companies) {
    try {
      await pgPool.query(`
        INSERT INTO companies (id, name, code, contact_person, email, phone, address, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
        company.id || uuidv4(),
        company.name,
        company.code,
        company.contact_person,
        company.email,
        company.phone,
        company.address,
        company.is_active,
        company.created_at,
        company.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating company ${company.name}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} companies`);
}

async function migrateMaterials() {
  console.log('📦 Migrating materials...');
  
  const materials = sqliteDb.prepare('SELECT * FROM materials').all();
  let migrated = 0;
  
  for (const material of materials) {
    try {
      await pgPool.query(`
        INSERT INTO materials (id, name, code, type, gsm_range, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
        material.id || uuidv4(),
        material.name,
        material.code,
        material.type,
        material.gsm_range,
        material.description,
        material.is_active,
        material.created_at,
        material.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating material ${material.name}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} materials`);
}

async function migrateProductCategories() {
  console.log('📂 Migrating product categories...');
  
  const categories = sqliteDb.prepare('SELECT * FROM product_categories').all();
  let migrated = 0;
  
  for (const category of categories) {
    try {
      await pgPool.query(`
        INSERT INTO product_categories (id, name, description, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [
        category.id || uuidv4(),
        category.name,
        category.description,
        category.is_active,
        category.created_at,
        category.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating category ${category.name}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} product categories`);
}

async function migrateProducts() {
  console.log('📦 Migrating products...');
  
  const products = sqliteDb.prepare('SELECT * FROM products').all();
  let migrated = 0;
  
  for (const product of products) {
    try {
      await pgPool.query(`
        INSERT INTO products (id, product_item_code, brand, product_type, material_id, category_id, description, specifications, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        product.id || uuidv4(),
        product.product_item_code,
        product.brand,
        product.product_type,
        product.material_id,
        product.category_id,
        product.description,
        product.specifications ? JSON.stringify(product.specifications) : null,
        product.is_active,
        product.created_at,
        product.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating product ${product.product_item_code}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} products`);
}

async function migrateJobCards() {
  console.log('📋 Migrating job cards...');
  
  const jobCards = sqliteDb.prepare('SELECT * FROM job_cards').all();
  let migrated = 0;
  
  for (const jobCard of jobCards) {
    try {
      await pgPool.query(`
        INSERT INTO job_cards (id, job_card_id, company_id, product_id, po_number, quantity, priority, status, delivery_date, special_instructions, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
        jobCard.id || uuidv4(),
        jobCard.job_card_id,
        jobCard.company_id,
        jobCard.product_id,
        jobCard.po_number,
        jobCard.quantity,
        jobCard.priority,
        jobCard.status,
        jobCard.delivery_date,
        jobCard.special_instructions,
        jobCard.created_by,
        jobCard.created_at,
        jobCard.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating job card ${jobCard.job_card_id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} job cards`);
}

async function migratePrepressJobs() {
  console.log('🎨 Migrating prepress jobs...');
  
  const prepressJobs = sqliteDb.prepare('SELECT * FROM prepress_jobs').all();
  let migrated = 0;
  
  for (const prepressJob of prepressJobs) {
    try {
      await pgPool.query(`
        INSERT INTO prepress_jobs (id, job_card_id, assigned_designer_id, status, priority, design_requirements, artwork_files, feedback, completed_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        prepressJob.id || uuidv4(),
        prepressJob.job_card_id,
        prepressJob.assigned_designer_id,
        prepressJob.status,
        prepressJob.priority,
        prepressJob.design_requirements,
        prepressJob.artwork_files ? JSON.stringify(prepressJob.artwork_files) : null,
        prepressJob.feedback,
        prepressJob.completed_at,
        prepressJob.created_at,
        prepressJob.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating prepress job ${prepressJob.job_card_id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} prepress jobs`);
}

async function migrateJobLifecycle() {
  console.log('🔄 Migrating job lifecycle...');
  
  const lifecycleEntries = sqliteDb.prepare('SELECT * FROM job_lifecycle').all();
  let migrated = 0;
  
  for (const entry of lifecycleEntries) {
    try {
      await pgPool.query(`
        INSERT INTO job_lifecycle (id, job_card_id, prepress_job_id, current_stage, status, assigned_to, estimated_completion_date, actual_completion_date, notes, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        entry.id || uuidv4(),
        entry.job_card_id,
        entry.prepress_job_id,
        entry.current_stage,
        entry.status,
        entry.assigned_to,
        entry.estimated_completion_date,
        entry.actual_completion_date,
        entry.notes,
        entry.created_at,
        entry.updated_at
      ]);
      migrated++;
    } catch (error) {
      console.log(`❌ Error migrating lifecycle ${entry.job_card_id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Migrated ${migrated} lifecycle entries`);
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  const tables = ['users', 'companies', 'materials', 'product_categories', 'products', 'job_cards', 'prepress_jobs', 'job_lifecycle'];
  
  for (const table of tables) {
    try {
      const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      const pgResult = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`);
      const pgCount = parseInt(pgResult.rows[0].count);
      
      if (sqliteCount === pgCount) {
        console.log(`${table}: SQLite=${sqliteCount}, PostgreSQL=${pgCount} ✅`);
      } else {
        console.log(`${table}: SQLite=${sqliteCount}, PostgreSQL=${pgCount} ❌`);
      }
    } catch (error) {
      console.log(`${table}: Error verifying - ${error.message}`);
    }
  }
}

async function runMigration() {
  try {
    // Test PostgreSQL connection
    const client = await pgPool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection successful');
    client.release();
    
    // Migrate data
    await migrateUsers();
    await migrateCompanies();
    await migrateMaterials();
    await migrateProductCategories();
    await migrateProducts();
    await migrateJobCards();
    await migratePrepressJobs();
    await migrateJobLifecycle();
    
    // Verify migration
    await verifyMigration();
    
    console.log('🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pgPool.end();
    sqliteDb.close();
  }
}

runMigration();
