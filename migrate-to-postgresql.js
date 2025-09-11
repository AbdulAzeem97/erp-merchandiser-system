import Database from 'better-sqlite3';
import { Pool } from 'pg';
import fs from 'fs';

console.log('=== POSTGRESQL MIGRATION SCRIPT ===');

// PostgreSQL connection configuration
const pgConfig = {
    user: process.env.DB_USER || 'erp_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'erp_merchandiser',
    password: process.env.DB_PASSWORD || 'secure_password_123',
    port: parseInt(process.env.DB_PORT) || 5432,
    max: 20, // Maximum connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Create PostgreSQL connection pool
const pgPool = new Pool(pgConfig);

// SQLite database
const sqliteDb = new Database('erp_merchandiser.db');

// Migration functions
const migrationFunctions = {
    
    // Create PostgreSQL schema
    async createSchema() {
        console.log('📋 Creating PostgreSQL schema...');
        try {
            const schema = fs.readFileSync('simple-postgresql-schema.sql', 'utf8');
            await pgPool.query(schema);
            console.log('✅ PostgreSQL schema created successfully');
        } catch (error) {
            console.error('❌ Error creating schema:', error.message);
            throw error;
        }
    },

    // Migrate users
    async migrateUsers() {
        console.log('👥 Migrating users...');
        const users = sqliteDb.prepare('SELECT * FROM users').all();
        
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
                    user.is_active === 1,
                    user.created_at,
                    user.updated_at
                ]);
            } catch (error) {
                console.error(`❌ Error migrating user ${user.email}:`, error.message);
            }
        }
        console.log(`✅ Migrated ${users.length} users`);
    },

    // Migrate companies
    async migrateCompanies() {
        console.log('🏢 Migrating companies...');
        const companies = sqliteDb.prepare('SELECT * FROM companies').all();
        
        for (const company of companies) {
            try {
                await pgPool.query(`
                    INSERT INTO companies (id, name, code, contact_person, email, phone, address, country, is_active, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (id) DO NOTHING
                `, [
                    company.id,
                    company.name,
                    company.code,
                    company.contact_person,
                    company.email,
                    company.phone,
                    company.address,
                    company.country,
                    company.is_active === 1,
                    company.created_at,
                    company.updated_at
                ]);
            } catch (error) {
                console.error(`❌ Error migrating company ${company.name}:`, error.message);
            }
        }
        console.log(`✅ Migrated ${companies.length} companies`);
    },

    // Migrate products
    async migrateProducts() {
        console.log('📦 Migrating products...');
        const products = sqliteDb.prepare('SELECT * FROM products').all();
        
        for (const product of products) {
            try {
                await pgPool.query(`
                    INSERT INTO products (id, product_item_code, brand, material_id, gsm, product_type, category_id, fsc, fsc_claim, color_specifications, remarks, is_active, created_by, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                    ON CONFLICT (id) DO NOTHING
                `, [
                    product.id,
                    product.product_item_code,
                    product.brand,
                    product.material_id,
                    product.gsm,
                    product.product_type,
                    product.category_id,
                    product.fsc,
                    product.fsc_claim,
                    product.color_specifications,
                    product.remarks,
                    product.is_active === 1,
                    product.created_by,
                    product.created_at,
                    product.updated_at
                ]);
            } catch (error) {
                console.error(`❌ Error migrating product ${product.product_item_code}:`, error.message);
            }
        }
        console.log(`✅ Migrated ${products.length} products`);
    },

    // Migrate job cards
    async migrateJobCards() {
        console.log('📋 Migrating job cards...');
        const jobCards = sqliteDb.prepare('SELECT * FROM job_cards').all();
        
        for (const jobCard of jobCards) {
            try {
                await pgPool.query(`
                    INSERT INTO job_cards (id, job_card_id, product_id, company_id, po_number, quantity, delivery_date, target_date, customer_notes, special_instructions, priority, status, progress, created_by, created_at, updated_at, punched_by, punched_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    ON CONFLICT (id) DO NOTHING
                `, [
                    jobCard.id,
                    jobCard.job_card_id,
                    jobCard.product_id,
                    jobCard.company_id,
                    jobCard.po_number,
                    jobCard.quantity,
                    jobCard.delivery_date,
                    jobCard.target_date,
                    jobCard.customer_notes,
                    jobCard.special_instructions,
                    jobCard.priority,
                    jobCard.status,
                    jobCard.progress,
                    jobCard.created_by,
                    jobCard.created_at,
                    jobCard.updated_at,
                    jobCard.punched_by,
                    jobCard.punched_at
                ]);
            } catch (error) {
                console.error(`❌ Error migrating job card ${jobCard.job_card_id}:`, error.message);
            }
        }
        console.log(`✅ Migrated ${jobCards.length} job cards`);
    },

    // Migrate job lifecycle
    async migrateJobLifecycle() {
        console.log('🔄 Migrating job lifecycle...');
        const lifecycle = sqliteDb.prepare('SELECT * FROM job_lifecycle').all();
        
        for (const entry of lifecycle) {
            try {
                await pgPool.query(`
                    INSERT INTO job_lifecycle (id, job_card_id, status, current_stage, product_type, priority, prepress_job_id, prepress_status, prepress_notes, assigned_designer_id, created_by, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (id) DO NOTHING
                `, [
                    entry.id,
                    entry.job_card_id,
                    entry.status,
                    entry.current_stage,
                    entry.product_type,
                    entry.priority,
                    entry.prepress_job_id,
                    entry.prepress_status,
                    entry.prepress_notes,
                    entry.assigned_designer_id,
                    entry.created_by,
                    entry.created_at,
                    entry.updated_at
                ]);
            } catch (error) {
                console.error(`❌ Error migrating lifecycle ${entry.job_card_id}:`, error.message);
            }
        }
        console.log(`✅ Migrated ${lifecycle.length} lifecycle entries`);
    },

    // Migrate prepress jobs
    async migratePrepressJobs() {
        console.log('🎨 Migrating prepress jobs...');
        const prepressJobs = sqliteDb.prepare('SELECT * FROM prepress_jobs').all();
        
        for (const job of prepressJobs) {
            try {
                await pgPool.query(`
                    INSERT INTO prepress_jobs (id, job_card_id, assigned_designer_id, status, priority, due_date, started_at, completed_at, hod_last_remark, created_by, updated_by, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                    ON CONFLICT (id) DO NOTHING
                `, [
                    job.id,
                    job.job_card_id,
                    job.assigned_designer_id,
                    job.status,
                    job.priority,
                    job.due_date,
                    job.started_at,
                    job.completed_at,
                    job.hod_last_remark,
                    job.created_by,
                    job.updated_by,
                    job.created_at,
                    job.updated_at
                ]);
            } catch (error) {
                console.error(`❌ Error migrating prepress job ${job.job_card_id}:`, error.message);
            }
        }
        console.log(`✅ Migrated ${prepressJobs.length} prepress jobs`);
    },

    // Verify migration
    async verifyMigration() {
        console.log('🔍 Verifying migration...');
        
        const tables = ['users', 'companies', 'products', 'job_cards', 'job_lifecycle', 'prepress_jobs'];
        
        for (const table of tables) {
            try {
                const sqliteCount = sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
                const pgResult = await pgPool.query(`SELECT COUNT(*) as count FROM ${table}`);
                const pgCount = parseInt(pgResult.rows[0].count);
                
                console.log(`${table}: SQLite=${sqliteCount}, PostgreSQL=${pgCount} ${sqliteCount === pgCount ? '✅' : '❌'}`);
            } catch (error) {
                console.error(`❌ Error verifying ${table}:`, error.message);
            }
        }
    }
};

// Main migration function
async function runMigration() {
    try {
        console.log('🚀 Starting PostgreSQL migration...');
        
        // Test PostgreSQL connection
        await pgPool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connection successful');
        
        // Run migration steps
        await migrationFunctions.createSchema();
        await migrationFunctions.migrateUsers();
        await migrationFunctions.migrateCompanies();
        await migrationFunctions.migrateProducts();
        await migrationFunctions.migrateJobCards();
        await migrationFunctions.migrateJobLifecycle();
        await migrationFunctions.migratePrepressJobs();
        await migrationFunctions.verifyMigration();
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        // Clean up connections
        await pgPool.end();
        sqliteDb.close();
    }
}

// Run migration
runMigration();

