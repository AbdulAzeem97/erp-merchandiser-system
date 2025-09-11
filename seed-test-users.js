
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'erp_merchandiser.db');
const db = new Database(dbPath);

console.log('🚀 Starting to seed test users...');

async function seedTestUsers() {
  try {
    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Test users with specific roles
    const testUsers = [
      {
        id: 'af7a5280-be2e-4f03-9b37-ae6ac257e320',
        username: 'merchandiser1',
        email: 'merchandiser1@horizonsourcing.com',
        password_hash: hashedPassword,
        first_name: 'John',
        last_name: 'Merchandiser',
        role: 'MERCHANDISER'
      },
      {
        id: '72f4b890-1e23-4a5b-9876-123456789abc',
        username: 'hodprepress',
        email: 'hodprepress@horizonsourcing.com',
        password_hash: hashedPassword,
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'HOD_PREPRESS'
      },
      {
        id: '62081101-7c55-4a1e-bdfb-980e64999a74',
        username: 'emma.wilson',
        email: 'emma.wilson@horizonsourcing.com',
        password_hash: hashedPassword,
        first_name: 'Emma',
        last_name: 'Wilson',
        role: 'DESIGNER'
      },
      {
        id: '57c715e5-b409-4a3d-98f1-a37ab8b36215',
        username: 'james.brown',
        email: 'james.brown@horizonsourcing.com',
        password_hash: hashedPassword,
        first_name: 'James',
        last_name: 'Brown',
        role: 'DESIGNER'
      },
      {
        id: 'c77488cf-fec8-4b5e-804a-23edcc644bb7',
        username: 'lisa.garcia',
        email: 'lisa.garcia@horizonsourcing.com',
        password_hash: hashedPassword,
        first_name: 'Lisa',
        last_name: 'Garcia',
        role: 'DESIGNER'
      }
    ];

    // Clear existing test users
    const deleteStmt = db.prepare('DELETE FROM users WHERE username IN (?, ?, ?, ?, ?)');
    deleteStmt.run('merchandiser1', 'hodprepress', 'emma.wilson', 'james.brown', 'lisa.garcia');

    // Insert new test users
    const insertStmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `);

    for (const user of testUsers) {
      try {
        insertStmt.run(
          user.id,
          user.username,
          user.email,
          user.password_hash,
          user.first_name,
          user.last_name,
          user.role
        );
        console.log(`✅ Created ${user.role}: ${user.username} (${user.email})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${user.username}:`, error.message);
      }
    }

    // Add a test company
    const companyId = uuidv4();
    const companyStmt = db.prepare(`
      INSERT OR IGNORE INTO companies (id, name, code, contact_person, email, phone, address, country, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `);

    companyStmt.run(
      companyId,
      'JCP Brand',
      'JCP',
      'Michael Johnson',
      'contact@jcpbrand.com',
      '+1-555-0123',
      '123 Fashion Ave, New York, NY 10001',
      'USA'
    );

    console.log('✅ Created test company: JCP Brand');

    // Add a test material
    const materialId = uuidv4();
    const materialStmt = db.prepare(`
      INSERT OR IGNORE INTO materials (id, name, code, type, gsm_range, description, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `);

    materialStmt.run(
      materialId,
      'Coated 1 Side (C1S)',
      'C1S',
      'Paper',
      '200-400',
      'High-quality coated paper, one side coated for excellent print quality'
    );

    console.log('✅ Created test material: C1S');

    // Add a test product
    const productId = uuidv4();
    const productStmt = db.prepare(`
      INSERT OR IGNORE INTO products (id, product_item_code, brand, material_id, gsm, product_type, fsc, fsc_claim, color_specifications, remarks, is_active, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `);

    productStmt.run(
      productId,
      'BR-00-139-A',
      'Horizon Sourcing',
      materialId,
      350,
      'Hangtag',
      'FSC Certified',
      'FSC Mix',
      'CMYK + 1 PMS',
      'Premium hangtag for luxury brands',
      'af7a5280-be2e-4f03-9b37-ae6ac257e320'
    );

    console.log('✅ Created test product: BR-00-139-A');

    console.log('\n🎉 Test data seeded successfully!');
    console.log('\n📋 Test Users Created:');
    console.log('👤 Merchandiser: merchandiser1 / password123');
    console.log('👨‍💼 HOD Prepress: hodprepress / password123');
    console.log('🎨 Designer 1: emma.wilson / password123');
    console.log('🎨 Designer 2: james.brown / password123');
    console.log('🎨 Designer 3: lisa.garcia / password123');
    console.log('\n🏢 Test Company: JCP Brand');
    console.log('📦 Test Product: BR-00-139-A (Hangtag)');
    console.log('\n🚀 Ready to test the automated job assignment flow!');
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
  } finally {
    db.close();
  }
}

seedTestUsers();