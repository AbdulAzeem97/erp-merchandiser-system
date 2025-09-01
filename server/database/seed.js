import bcrypt from 'bcryptjs';
import pool from './config.js';

async function seedDatabase() {
  try {
    console.log('Starting PostgreSQL database seeding...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO NOTHING
    `, ['admin', 'admin@horizonsourcing.com', adminPassword, 'Admin', 'User', 'admin']);

    // Create sample companies
    const companies = [
      ['Nike', 'NIKE', 'John Smith', 'john@nike.com', '+1-555-0123', '123 Nike St, Oregon, USA', 'USA'],
      ['Adidas', 'ADIDAS', 'Sarah Johnson', 'sarah@adidas.com', '+49-555-0456', '456 Adidas Ave, Germany', 'Germany'],
      ['Puma', 'PUMA', 'Mike Wilson', 'mike@puma.com', '+49-555-0789', '789 Puma Rd, Germany', 'Germany'],
      ['Under Armour', 'UA', 'Lisa Brown', 'lisa@ua.com', '+1-555-0321', '321 UA Blvd, Maryland, USA', 'USA']
    ];

    for (const company of companies) {
      await pool.query(`
        INSERT INTO companies (name, code, contact_person, email, phone, address, country)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (code) DO NOTHING
      `, company);
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
      await pool.query(`
        INSERT INTO product_categories (name, description)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, category);
    }

    // Create materials
    const materials = [
      ['Art Card', 'AC001', 'Paper', '200-300 GSM', 'High quality art paper'],
      ['Craft Card', 'CC001', 'Paper', '150-250 GSM', 'Standard craft paper'],
      ['Tyvek', 'TY001', 'Synthetic', '50-100 GSM', 'Durable synthetic material'],
      ['Yupo Paper', 'YP001', 'Synthetic', '80-120 GSM', 'Premium synthetic paper']
    ];

    for (const material of materials) {
      await pool.query(`
        INSERT INTO materials (name, code, type, gsm_range, description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code) DO NOTHING
      `, material);
    }

    console.log('✅ PostgreSQL database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
