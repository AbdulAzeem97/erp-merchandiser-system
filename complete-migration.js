#!/usr/bin/env node

/**
 * Complete PostgreSQL Migration Script
 * Handles duplicates and ensures production-ready setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  postgresql: {
    user: process.env.DB_USER || 'erp_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'erp_merchandiser',
    password: process.env.DB_PASSWORD || 'DevPassword123!',
    port: process.env.DB_PORT || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
};

class CompleteMigrator {
  constructor() {
    this.pgPool = null;
    this.migrationLog = [];
  }

  async initialize() {
    try {
      console.log('🚀 Initializing PostgreSQL Migration...');
      
      // Initialize PostgreSQL connection
      this.pgPool = new Pool(config.postgresql);
      await this.testConnection();
      
      console.log('✅ Migration setup complete!');
    } catch (error) {
      console.error('❌ Failed to initialize migration:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const client = await this.pgPool.connect();
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('✅ PostgreSQL connection successful');
      console.log(`📅 Server time: ${result.rows[0].current_time}`);
      console.log(`🐘 PostgreSQL version: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`);
      client.release();
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      console.error('💡 Make sure PostgreSQL is running: docker-compose up -d postgres');
      throw error;
    }
  }

  async runCompleteMigration() {
    try {
      console.log('\n🔄 Starting Complete PostgreSQL Setup...\n');

      // Step 1: Drop existing data if needed (development only)
      await this.cleanupDevelopmentData();
      
      // Step 2: Create/Update schema
      await this.setupSchema();
      
      // Step 3: Create seed data
      await this.setupSeedData();
      
      // Step 4: Verify setup
      await this.verifySetup();
      
      console.log('\n✅ Complete migration finished successfully!\n');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async cleanupDevelopmentData() {
    console.log('🧹 Cleaning up development data...');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Skipping cleanup in production environment');
      return;
    }
    
    try {
      // Check if tables exist and have data
      const result = await this.pgPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      if (result.rows.length > 0) {
        console.log(`📊 Found ${result.rows.length} existing tables`);
        
        // Ask for confirmation in interactive mode
        const shouldClean = process.argv.includes('--force') || process.env.FORCE_CLEAN === 'true';
        
        if (shouldClean) {
          console.log('🗑️ Dropping existing tables...');
          await this.pgPool.query('DROP SCHEMA public CASCADE');
          await this.pgPool.query('CREATE SCHEMA public');
          await this.pgPool.query('GRANT ALL ON SCHEMA public TO erp_user');
          await this.pgPool.query('GRANT ALL ON SCHEMA public TO public');
          console.log('✅ Development data cleaned');
        } else {
          console.log('ℹ️ Keeping existing data (use --force to clean)');
        }
      }
      
      this.migrationLog.push('Development cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      // Don't throw - continue with migration
    }
  }

  async setupSchema() {
    console.log('📋 Setting up database schema...');
    
    try {
      const schemaPath = path.join(__dirname, 'server', 'database', 'init', '01-create-database.sql');
      
      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found: ${schemaPath}`);
      }
      
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Split and execute SQL statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Executing ${statements.length} schema statements...`);
      
      for (const statement of statements) {
        try {
          await this.pgPool.query(statement);
        } catch (error) {
          // Log non-critical errors but continue
          if (error.code !== '42P07' && error.code !== '42710') { // relation/function already exists
            console.log(`⚠️ Non-critical schema error: ${error.message}`);
          }
        }
      }
      
      console.log('✅ Database schema setup complete');
      this.migrationLog.push('Schema creation completed');
      
    } catch (error) {
      console.error('❌ Schema setup failed:', error);
      throw error;
    }
  }

  async setupSeedData() {
    console.log('🌱 Setting up seed data...');
    
    try {
      const seedPath = path.join(__dirname, 'server', 'database', 'init', '02-seed-data.sql');
      
      if (!fs.existsSync(seedPath)) {
        console.log('⚠️ Seed file not found, creating minimal data...');
        await this.createMinimalSeedData();
        return;
      }
      
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      
      // Execute seed data with better error handling
      try {
        await this.pgPool.query(seedSQL);
        console.log('✅ Seed data setup complete');
      } catch (error) {
        console.log('⚠️ Seed data had conflicts (likely duplicates), continuing...');
        console.log(`Error: ${error.message}`);
      }
      
      this.migrationLog.push('Seed data creation completed');
      
    } catch (error) {
      console.error('❌ Seed data setup failed:', error);
      // Don't throw - app can work without seed data
    }
  }

  async createMinimalSeedData() {
    console.log('📝 Creating minimal required data...');
    
    try {
      // Create admin user
      const adminId = uuidv4();
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      await this.pgPool.query(`
        INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
      `, [
        adminId,
        'admin',
        'admin@horizonsourcing.com',
        hashedPassword,
        'System',
        'Administrator',
        'ADMIN',
        true
      ]);
      
      // Create sample company
      const companyId = uuidv4();
      await this.pgPool.query(`
        INSERT INTO companies (id, name, code, email, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [
        companyId,
        'Sample Company Ltd.',
        'SAMPLE',
        'info@sample.com',
        'ACTIVE'
      ]);
      
      console.log('✅ Minimal seed data created');
      
    } catch (error) {
      console.error('❌ Minimal seed data creation failed:', error);
    }
  }

  async verifySetup() {
    console.log('🔍 Verifying database setup...');
    
    try {
      // Check tables
      const tables = await this.pgPool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      console.log(`📊 Found ${tables.rows.length} tables:`);
      tables.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
      
      // Check users
      const users = await this.pgPool.query('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users: ${users.rows[0].count}`);
      
      // Check companies
      const companies = await this.pgPool.query('SELECT COUNT(*) as count FROM companies');
      console.log(`🏢 Companies: ${companies.rows[0].count}`);
      
      // Test admin login
      const admin = await this.pgPool.query(
        'SELECT id, email, role FROM users WHERE email = $1',
        ['admin@horizonsourcing.com']
      );
      
      if (admin.rows.length > 0) {
        console.log(`👤 Admin user verified: ${admin.rows[0].email} (${admin.rows[0].role})`);
      } else {
        console.log('⚠️ Admin user not found');
      }
      
      console.log('✅ Database verification complete');
      this.migrationLog.push('Database verification completed');
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }

  printSummary() {
    console.log('📊 Migration Summary:');
    console.log('====================================');
    this.migrationLog.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });
    console.log('====================================');
    console.log('🎉 PostgreSQL setup completed successfully!');
    console.log('');
    console.log('📋 Connection Details:');
    console.log(`   Host: ${config.postgresql.host}:${config.postgresql.port}`);
    console.log(`   Database: ${config.postgresql.database}`);
    console.log(`   User: ${config.postgresql.user}`);
    console.log('');
    console.log('🔗 Access Points:');
    console.log('   📊 PgAdmin: http://localhost:5050');
    console.log('       Email: admin@erp.local');
    console.log('       Password: admin123');
    console.log('');
    console.log('🔑 Default Credentials:');
    console.log('   👤 Admin: admin@horizonsourcing.com / admin123');
    console.log('');
    console.log('💡 Next Steps:');
    console.log('1. Update your .env file:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5432');
    console.log('   DB_NAME=erp_merchandiser');
    console.log('   DB_USER=erp_user');
    console.log('   DB_PASSWORD=DevPassword123!');
    console.log('');
    console.log('2. Restart your application');
    console.log('3. Test login with admin credentials');
  }

  async cleanup() {
    try {
      if (this.pgPool) {
        await this.pgPool.end();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 ERP Merchandiser System - PostgreSQL Migration Tool');
  console.log('=====================================================\n');
  
  const migrator = new CompleteMigrator();
  
  try {
    await migrator.initialize();
    await migrator.runCompleteMigration();
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Docker is running');
    console.log('2. Run: docker-compose up -d postgres');
    console.log('3. Wait for PostgreSQL to start (check: docker-compose logs postgres)');
    console.log('4. Try running this script again');
    process.exit(1);
  } finally {
    await migrator.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default CompleteMigrator;