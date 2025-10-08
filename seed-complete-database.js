/**
 * Complete Database Seeding Script
 * Seeds all users with properly hashed passwords
 * Run this after creating the database schema
 */

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'erp_merchandiser',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password_here'
};

const pool = new Pool(dbConfig);

// User credentials (plain text - will be hashed)
const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@horizonsourcing.com',
    password: 'admin123',
    role: 'ADMIN',
    department: 'Administration'
  },
  {
    firstName: 'HOD',
    lastName: 'Prepress',
    email: 'hod.prepress@horizonsourcing.com',
    password: 'hod123',
    role: 'HOD_PREPRESS',
    department: 'Prepress'
  },
  {
    firstName: 'Designer',
    lastName: 'User',
    email: 'designer@horizonsourcing.com',
    password: 'designer123',
    role: 'DESIGNER',
    department: 'Prepress'
  },
  {
    firstName: 'QA',
    lastName: 'Prepress',
    email: 'qa.prepress@horizonsourcing.com',
    password: 'qa123',
    role: 'QA_PREPRESS',
    department: 'Quality Assurance'
  },
  {
    firstName: 'CTP',
    lastName: 'Operator',
    email: 'ctp.operator@horizonsourcing.com',
    password: 'ctp123',
    role: 'CTP_OPERATOR',
    department: 'Prepress'
  },
  {
    firstName: 'Inventory',
    lastName: 'Manager',
    email: 'inventory.manager@horizonsourcing.com',
    password: 'inventory123',
    role: 'INVENTORY_MANAGER',
    department: 'Inventory'
  },
  {
    firstName: 'Procurement',
    lastName: 'Manager',
    email: 'procurement.manager@horizonsourcing.com',
    password: 'procurement123',
    role: 'PROCUREMENT_MANAGER',
    department: 'Procurement'
  }
];

async function seedUsers() {
  console.log('🔐 Seeding users with hashed passwords...\n');

  for (const user of users) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Check if user exists
      const checkQuery = 'SELECT id, email FROM users WHERE email = $1';
      const checkResult = await pool.query(checkQuery, [user.email]);

      if (checkResult.rows.length > 0) {
        // Update existing user
        const updateQuery = `
          UPDATE users 
          SET 
            "firstName" = $1,
            "lastName" = $2,
            password = $3,
            role = $4,
            department = $5,
            "isActive" = TRUE,
            "updatedAt" = NOW()
          WHERE email = $6
          RETURNING id, email, role
        `;
        
        const result = await pool.query(updateQuery, [
          user.firstName,
          user.lastName,
          hashedPassword,
          user.role,
          user.department,
          user.email
        ]);

        console.log(`✅ Updated user: ${user.email} (${user.role})`);
        console.log(`   Password: ${user.password}`);
      } else {
        // Insert new user
        const insertQuery = `
          INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
          VALUES ($1, $2, $3, $4, $5, $6, TRUE)
          RETURNING id, email, role
        `;

        const result = await pool.query(insertQuery, [
          user.firstName,
          user.lastName,
          user.email,
          hashedPassword,
          user.role,
          user.department
        ]);

        console.log(`✅ Created user: ${user.email} (${user.role})`);
        console.log(`   Password: ${user.password}`);
      }
    } catch (error) {
      console.error(`❌ Error seeding user ${user.email}:`, error.message);
    }
  }
}

async function seedCategories() {
  console.log('\n📁 Seeding categories...\n');

  const categories = [
    { name: 'Labels', description: 'Various types of labels' },
    { name: 'Packaging', description: 'Packaging materials' },
    { name: 'Printed Materials', description: 'Printed products' },
    { name: 'Stickers', description: 'Adhesive stickers' },
    { name: 'Tags', description: 'Product tags' }
  ];

  for (const category of categories) {
    try {
      await pool.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [category.name, category.description]
      );
      console.log(`✅ Seeded category: ${category.name}`);
    } catch (error) {
      console.error(`❌ Error seeding category ${category.name}:`, error.message);
    }
  }
}

async function seedMaterials() {
  console.log('\n🎨 Seeding materials...\n');

  const materials = [
    { name: 'Paper', type: 'Raw Material', unit: 'KG' },
    { name: 'Ink - Cyan', type: 'Consumable', unit: 'LTR' },
    { name: 'Ink - Magenta', type: 'Consumable', unit: 'LTR' },
    { name: 'Ink - Yellow', type: 'Consumable', unit: 'LTR' },
    { name: 'Ink - Black', type: 'Consumable', unit: 'LTR' },
    { name: 'Adhesive', type: 'Consumable', unit: 'KG' },
    { name: 'Plastic Film', type: 'Raw Material', unit: 'MTR' }
  ];

  for (const material of materials) {
    try {
      await pool.query(
        'INSERT INTO materials (name, type, unit) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
        [material.name, material.type, material.unit]
      );
      console.log(`✅ Seeded material: ${material.name}`);
    } catch (error) {
      console.error(`❌ Error seeding material ${material.name}:`, error.message);
    }
  }
}

async function seedCompanies() {
  console.log('\n🏢 Seeding companies...\n');

  const companies = [
    {
      name: 'ABC Corporation',
      contactPerson: 'John Smith',
      email: 'john@abc.com',
      phone: '+1-234-567-8900',
      address: '123 Business St',
      city: 'New York',
      country: 'USA'
    },
    {
      name: 'XYZ Industries',
      contactPerson: 'Jane Doe',
      email: 'jane@xyz.com',
      phone: '+1-345-678-9012',
      address: '456 Commerce Ave',
      city: 'Los Angeles',
      country: 'USA'
    },
    {
      name: 'Global Brands Ltd',
      contactPerson: 'Mike Johnson',
      email: 'mike@globalbrands.com',
      phone: '+1-456-789-0123',
      address: '789 Industry Blvd',
      city: 'Chicago',
      country: 'USA'
    }
  ];

  for (const company of companies) {
    try {
      const result = await pool.query(
        `INSERT INTO companies (name, "contactPerson", email, phone, address, city, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [company.name, company.contactPerson, company.email, company.phone, company.address, company.city, company.country]
      );
      console.log(`✅ Seeded company: ${company.name}`);
    } catch (error) {
      console.error(`❌ Error seeding company ${company.name}:`, error.message);
    }
  }
}

async function seedProcessSteps() {
  console.log('\n⚙️ Seeding process steps...\n');

  const steps = [
    { name: 'Design', description: 'Create initial design', department: 'Prepress', sequence_order: 1, estimated_time_hours: 4 },
    { name: 'Quality Check', description: 'QA review of design', department: 'Quality Assurance', sequence_order: 2, estimated_time_hours: 2 },
    { name: 'Plate Generation', description: 'Generate printing plates', department: 'Prepress', sequence_order: 3, estimated_time_hours: 1 },
    { name: 'Printing', description: 'Print the product', department: 'Production', sequence_order: 4, estimated_time_hours: 8 },
    { name: 'Finishing', description: 'Final finishing operations', department: 'Production', sequence_order: 5, estimated_time_hours: 4 }
  ];

  for (const step of steps) {
    try {
      await pool.query(
        `INSERT INTO process_steps (name, description, department, sequence_order, estimated_time_hours)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING`,
        [step.name, step.description, step.department, step.sequence_order, step.estimated_time_hours]
      );
      console.log(`✅ Seeded process step: ${step.name}`);
    } catch (error) {
      console.error(`❌ Error seeding process step ${step.name}:`, error.message);
    }
  }
}

async function seedInventoryCategories() {
  console.log('\n📦 Seeding inventory categories...\n');

  const categories = [
    { department: 'Printing', master_category: 'Printing Materials', control_category: 'Flexo Ink', description: 'Flexographic printing inks' },
    { department: 'Printing', master_category: 'Printing Materials', control_category: 'Screen Ink', description: 'Screen printing inks' },
    { department: 'Printing', master_category: 'Printing Materials', control_category: 'Offset Ink', description: 'Offset printing inks' },
    { department: 'Production', master_category: 'Packing Material', control_category: 'Carton Boxes', description: 'Packaging cartons' },
    { department: 'Production', master_category: 'Packing Material', control_category: 'Plastic Film', description: 'Plastic wrapping films' },
    { department: 'Production', master_category: 'Raw Material', control_category: 'Paper Stock', description: 'Paper materials' }
  ];

  for (const category of categories) {
    try {
      await pool.query(
        `INSERT INTO inventory_categories (department, master_category, control_category, description)
         VALUES ($1, $2, $3, $4)`,
        [category.department, category.master_category, category.control_category, category.description]
      );
      console.log(`✅ Seeded inventory category: ${category.control_category}`);
    } catch (error) {
      console.error(`❌ Error seeding inventory category:`, error.message);
    }
  }
}

async function seedInventoryLocations() {
  console.log('\n📍 Seeding inventory locations...\n');

  const locations = [
    { location_name: 'Main Warehouse', location_type: 'Warehouse', description: 'Primary storage facility' },
    { location_name: 'Production Floor', location_type: 'Production', description: 'Production area storage' },
    { location_name: 'Quality Check Area', location_type: 'QA', description: 'Quality assurance storage' },
    { location_name: 'Raw Materials Store', location_type: 'Warehouse', description: 'Raw materials storage' },
    { location_name: 'Finished Goods Store', location_type: 'Warehouse', description: 'Finished products storage' }
  ];

  for (const location of locations) {
    try {
      await pool.query(
        `INSERT INTO inventory_locations (location_name, location_type, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (location_name) DO NOTHING`,
        [location.location_name, location.location_type, location.description]
      );
      console.log(`✅ Seeded location: ${location.location_name}`);
    } catch (error) {
      console.error(`❌ Error seeding location:`, error.message);
    }
  }
}

async function seedInventoryItems() {
  console.log('\n📦 Seeding inventory items...\n');

  const items = [
    { item_code: 'INK-FLX-001', item_name: 'Flexo Ink - Cyan', unit: 'LTR', category_id: 1, reorder_level: 50, unit_cost: 25.50 },
    { item_code: 'INK-FLX-002', item_name: 'Flexo Ink - Magenta', unit: 'LTR', category_id: 1, reorder_level: 50, unit_cost: 25.50 },
    { item_code: 'INK-FLX-003', item_name: 'Flexo Ink - Yellow', unit: 'LTR', category_id: 1, reorder_level: 50, unit_cost: 25.50 },
    { item_code: 'INK-FLX-004', item_name: 'Flexo Ink - Black', unit: 'LTR', category_id: 1, reorder_level: 50, unit_cost: 25.50 },
    { item_code: 'INK-SCR-001', item_name: 'Screen Ink - White', unit: 'KG', category_id: 2, reorder_level: 30, unit_cost: 15.75 },
    { item_code: 'INK-SCR-002', item_name: 'Screen Ink - Black', unit: 'KG', category_id: 2, reorder_level: 30, unit_cost: 15.75 },
    { item_code: 'PKG-CTN-001', item_name: 'Carton Box - Small', unit: 'PCS', category_id: 4, reorder_level: 100, unit_cost: 2.50 },
    { item_code: 'PKG-CTN-002', item_name: 'Carton Box - Medium', unit: 'PCS', category_id: 4, reorder_level: 100, unit_cost: 3.50 },
    { item_code: 'PKG-CTN-003', item_name: 'Carton Box - Large', unit: 'PCS', category_id: 4, reorder_level: 100, unit_cost: 4.50 },
    { item_code: 'PKG-FLM-001', item_name: 'Plastic Film Roll', unit: 'MTR', category_id: 5, reorder_level: 500, unit_cost: 0.85 }
  ];

  for (const item of items) {
    try {
      await pool.query(
        `INSERT INTO inventory_items (item_code, item_name, unit, category_id, reorder_level, unit_cost)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (item_code) DO NOTHING`,
        [item.item_code, item.item_name, item.unit, item.category_id, item.reorder_level, item.unit_cost]
      );
      console.log(`✅ Seeded inventory item: ${item.item_name}`);
    } catch (error) {
      console.error(`❌ Error seeding inventory item:`, error.message);
    }
  }
}

async function seedSuppliers() {
  console.log('\n🏭 Seeding suppliers...\n');

  const suppliers = [
    {
      supplier_code: 'SUP-001',
      supplier_name: 'Ink Solutions Ltd',
      contact_person: 'Michael Brown',
      email: 'michael@inksolutions.com',
      phone: '+1-456-789-0123',
      address: '123 Industrial Park',
      city: 'Chicago',
      country: 'USA',
      payment_terms: 'Net 30',
      credit_limit: 50000
    },
    {
      supplier_code: 'SUP-002',
      supplier_name: 'Packaging Pro',
      contact_person: 'Sarah Wilson',
      email: 'sarah@packagingpro.com',
      phone: '+1-567-890-1234',
      address: '456 Commerce St',
      city: 'Houston',
      country: 'USA',
      payment_terms: 'Net 45',
      credit_limit: 75000
    },
    {
      supplier_code: 'SUP-003',
      supplier_name: 'Materials Direct',
      contact_person: 'Robert Johnson',
      email: 'robert@materialsdirect.com',
      phone: '+1-678-901-2345',
      address: '789 Supply Blvd',
      city: 'Phoenix',
      country: 'USA',
      payment_terms: 'Net 30',
      credit_limit: 60000
    }
  ];

  for (const supplier of suppliers) {
    try {
      await pool.query(
        `INSERT INTO suppliers (supplier_code, supplier_name, contact_person, email, phone, address, city, country, payment_terms, credit_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (supplier_code) DO NOTHING`,
        [supplier.supplier_code, supplier.supplier_name, supplier.contact_person, supplier.email, supplier.phone,
         supplier.address, supplier.city, supplier.country, supplier.payment_terms, supplier.credit_limit]
      );
      console.log(`✅ Seeded supplier: ${supplier.supplier_name}`);
    } catch (error) {
      console.error(`❌ Error seeding supplier:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Starting complete database seeding...\n');
  console.log('📊 Database Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}\n`);

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    console.log('=' .repeat(60));

    // Seed all data
    await seedUsers();
    await seedCategories();
    await seedMaterials();
    await seedCompanies();
    await seedProcessSteps();
    await seedInventoryCategories();
    await seedInventoryLocations();
    await seedInventoryItems();
    await seedSuppliers();

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📝 User Credentials:');
    console.log('-'.repeat(60));
    users.forEach(user => {
      console.log(`   ${user.role.padEnd(20)} | ${user.email.padEnd(40)} | ${user.password}`);
    });
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Database seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Database connection closed');
  }
}

main();

