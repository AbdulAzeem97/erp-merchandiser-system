import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dbAdapter from './adapter.js';

async function seedDatabase() {
  try {
    console.log('Starting SQLite database seeding...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminId = uuidv4();
    
    await pool.query(`
      INSERT INTO users (id, username, email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO NOTHING
    `, [adminId, 'admin', 'admin@horizonsourcing.com', adminPassword, 'Admin', 'User', 'admin']);

    // Create sample companies
    const companies = [
      ['Nike', 'NIKE', 'John Smith', 'john@nike.com', '+1-555-0123', '123 Nike St, Oregon, USA', 'USA'],
      ['Adidas', 'ADIDAS', 'Sarah Johnson', 'sarah@adidas.com', '+49-555-0456', '456 Adidas Ave, Germany', 'Germany'],
      ['Puma', 'PUMA', 'Mike Wilson', 'mike@puma.com', '+49-555-0789', '789 Puma Rd, Germany', 'Germany'],
      ['Under Armour', 'UA', 'Lisa Brown', 'lisa@ua.com', '+1-555-0321', '321 UA Blvd, Maryland, USA', 'USA']
    ];

    for (const company of companies) {
      const companyId = uuidv4();
      await pool.query(`
        INSERT INTO companies (id, name, code, contact_person, email, phone, address, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (code) DO NOTHING
      `, [companyId, ...company]);
    }

    // Create product categories
    const categories = [
      ['Hang Tags', 'Product identification tags'],
      ['Price Tags', 'Pricing information tags'],
      ['Care Labels', 'Care instruction labels'],
      ['Size Labels', 'Size specification labels'],
      ['Brand Labels', 'Brand identification labels']
    ];

    for (const category of categories) {
      const categoryId = uuidv4();
      await pool.query(`
        INSERT INTO product_categories (id, name, description)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [categoryId, ...category]);
    }

    // Create materials
    const materials = [
      ['Art Card', 'AC001', 'Paper', '200-300 GSM', 'High quality art paper'],
      ['Craft Card', 'CC001', 'Paper', '150-250 GSM', 'Standard craft paper'],
      ['Tyvek', 'TY001', 'Synthetic', '50-100 GSM', 'Durable synthetic material'],
      ['Yupo Paper', 'YP001', 'Synthetic', '80-120 GSM', 'Premium synthetic paper']
    ];

    for (const material of materials) {
      const materialId = uuidv4();
      await pool.query(`
        INSERT INTO materials (id, name, code, type, gsm_range, description)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (code) DO NOTHING
      `, [materialId, ...material]);
    }

    console.log('✅ SQLite database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // SQLite doesn't need explicit connection closing like PostgreSQL
  }
}

seedDatabase();