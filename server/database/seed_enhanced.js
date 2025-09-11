import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import dbAdapter from './adapter.js';

dotenv.config();

// Enhanced roles for the new system
const ROLES = {
  ADMIN: 'ADMIN',
  HEAD_OF_MERCHANDISER: 'HEAD_OF_MERCHANDISER',
  HEAD_OF_PRODUCTION: 'HEAD_OF_PRODUCTION',
  HOD_PREPRESS: 'HOD_PREPRESS',
  DESIGNER: 'DESIGNER',
  MERCHANDISER: 'MERCHANDISER'
};

const PREPRESS_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PAUSED', 'HOD_REVIEW', 'COMPLETED', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const JOB_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED'];

async function seedEnhancedData() {
  try {
    console.log('🌱 Starting enhanced data seeding...');
    
    // 1. Create enhanced users with new roles
    console.log('👥 Creating users with enhanced roles...');
    
    const users = [
      // Admin
      {
        username: 'admin',
        email: 'admin@horizonsourcing.com',
        password: 'admin123',
        first_name: 'System',
        last_name: 'Administrator',
        role: ROLES.ADMIN
      },
      // Head of Merchandiser
      {
        username: 'hom_sarah',
        email: 'sarah.chen@horizonsourcing.com',
        password: 'hom123',
        first_name: 'Sarah',
        last_name: 'Chen',
        role: ROLES.HEAD_OF_MERCHANDISER
      },
      // Head of Production
      {
        username: 'hop_mike',
        email: 'mike.rodriguez@horizonsourcing.com',
        password: 'hop123',
        first_name: 'Mike',
        last_name: 'Rodriguez',
        role: ROLES.HEAD_OF_PRODUCTION
      },
      // HOD Prepress
      {
        username: 'hod_alex',
        email: 'alex.kumar@horizonsourcing.com',
        password: 'hod123',
        first_name: 'Alex',
        last_name: 'Kumar',
        role: ROLES.HOD_PREPRESS
      },
      // Designe
      // rs
      {
        username: 'designer_emma',
        email: 'emma.wilson@horizonsourcing.com',
        password: 'designer123',
        first_name: 'Emma',
        last_name: 'Wilson',
        role: ROLES.DESIGNER
      },
      {
        username: 'designer_james',
        email: 'james.brown@horizonsourcing.com',
        password: 'designer123',
        first_name: 'James',
        last_name: 'Brown',
        role: ROLES.DESIGNER
      },
      {
        username: 'designer_lisa',
        email: 'lisa.garcia@horizonsourcing.com',
        password: 'designer123',
        first_name: 'Lisa',
        last_name: 'Garcia',
        role: ROLES.DESIGNER
      },
      // Merchandisers
      {
        username: 'merch_tom',
        email: 'tom.anderson@horizonsourcing.com',
        password: 'merch123',
        first_name: 'Tom',
        last_name: 'Anderson',
        role: ROLES.MERCHANDISER
      },
      {
        username: 'merch_anna',
        email: 'anna.taylor@horizonsourcing.com',
        password: 'merch123',
        first_name: 'Anna',
        last_name: 'Taylor',
        role: ROLES.MERCHANDISER
      },
      {
        username: 'merch_david',
        email: 'david.martinez@horizonsourcing.com',
        password: 'merch123',
        first_name: 'David',
        last_name: 'Martinez',
        role: ROLES.MERCHANDISER
      }
    ];

    const userIds = {};
    
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const userId = uuidv4();
      const result = await pool.query(`
        INSERT OR REPLACE INTO users (id, username, email, password_hash, first_name, last_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [userId, user.username, user.email, hashedPassword, user.first_name, user.last_name, user.role]);
      
      // Store the generated user ID
      userIds[user.email] = userId;
      console.log(`✅ Created user: ${user.first_name} ${user.last_name} (${user.role})`);
    }

    // 2. Create companies
    console.log('🏢 Creating companies...');
    const companies = [
      { name: 'Nike Inc.', code: 'NIKE', contact_person: 'John Smith', email: 'john@nike.com', phone: '+1-555-0101', country: 'USA' },
      { name: 'Adidas AG', code: 'ADIDAS', contact_person: 'Maria Garcia', email: 'maria@adidas.com', phone: '+49-555-0102', country: 'Germany' },
      { name: 'Puma SE', code: 'PUMA', contact_person: 'Ahmed Hassan', email: 'ahmed@puma.com', phone: '+49-555-0103', country: 'Germany' },
      { name: 'Under Armour', code: 'UA', contact_person: 'Jennifer Lee', email: 'jennifer@underarmour.com', phone: '+1-555-0104', country: 'USA' },
      { name: 'Reebok', code: 'REEBOK', contact_person: 'Carlos Mendez', email: 'carlos@reebok.com', phone: '+1-555-0105', country: 'USA' },
      { name: 'New Balance', code: 'NB', contact_person: 'Sophie Martin', email: 'sophie@newbalance.com', phone: '+1-555-0106', country: 'USA' },
      { name: 'Converse', code: 'CONVERSE', contact_person: 'Robert Kim', email: 'robert@converse.com', phone: '+1-555-0107', country: 'USA' },
      { name: 'Vans', code: 'VANS', contact_person: 'Laura Johnson', email: 'laura@vans.com', phone: '+1-555-0108', country: 'USA' },
      { name: 'Champion', code: 'CHAMPION', contact_person: 'Michael Davis', email: 'michael@champion.com', phone: '+1-555-0109', country: 'USA' },
      { name: 'Fila', code: 'FILA', contact_person: 'Elena Rossi', email: 'elena@fila.com', phone: '+39-555-0110', country: 'Italy' }
    ];

    const companyIds = [];
    for (const company of companies) {
      const result = await pool.query(`
        INSERT INTO companies (name, code, contact_person, email, phone, country, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          contact_person = EXCLUDED.contact_person,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          country = EXCLUDED.country
        RETURNING id
      `, [company.name, company.code, company.contact_person, company.email, company.phone, company.country]);
      
      // For SQLite, we need to get the row using the insertId
      if (result.rows.length === 0 && result.insertId) {
        const companyResult = await pool.query('SELECT id FROM companies WHERE rowid = ?', [result.insertId]);
        companyIds.push(companyResult.rows[0].id);
      } else {
        companyIds.push(result.rows[0].id);
      }
      console.log(`✅ Created company: ${company.name}`);
    }

    // 3. Create materials
    console.log('📦 Creating materials...');
    const materials = [
      { name: 'C1S White', code: 'C1S-W', type: 'Coated', gsm_range: '200-300' },
      { name: 'C2S White', code: 'C2S-W', type: 'Coated', gsm_range: '250-350' },
      { name: 'Kraft Brown', code: 'KRAFT-B', type: 'Uncoated', gsm_range: '180-250' },
      { name: 'Art Paper', code: 'ART-P', type: 'Coated', gsm_range: '150-200' },
      { name: 'Duplex Board', code: 'DUPLEX', type: 'Board', gsm_range: '300-500' },
      { name: 'Corrugated', code: 'CORR', type: 'Board', gsm_range: '400-800' },
      { name: 'Coated Paper', code: 'COATED', type: 'Coated', gsm_range: '120-200' }
    ];

    const materialIds = [];
    for (const material of materials) {
      const result = await pool.query(`
        INSERT INTO materials (name, code, type, gsm_range, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type,
          gsm_range = EXCLUDED.gsm_range
        RETURNING id
      `, [material.name, material.code, material.type, material.gsm_range]);
      
      // For SQLite, we need to get the row using the insertId
      if (result.rows.length === 0 && result.insertId) {
        const materialResult = await pool.query('SELECT id FROM materials WHERE rowid = ?', [result.insertId]);
        materialIds.push(materialResult.rows[0].id);
      } else {
        materialIds.push(result.rows[0].id);
      }
      console.log(`✅ Created material: ${material.name}`);
    }

    // 4. Create products
    console.log('🏷️ Creating products...');
    const productTypes = ['Offset', 'Heat Transfer Label', 'PFL', 'Woven', 'Thermal', 'Leather Patch', 'Digital', 'Screen Print', 'Embroidery'];
    const brands = ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Reebok', 'New Balance', 'Converse', 'Vans', 'Champion', 'Fila'];
    
    const productIds = [];
    for (let i = 1; i <= 50; i++) {
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const materialId = materialIds[Math.floor(Math.random() * materialIds.length)];
      const gsm = Math.floor(Math.random() * 200) + 150;
      
      const result = await pool.query(`
        INSERT INTO products (product_item_code, brand, material_id, gsm, product_type, fsc, color_specifications, is_active, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
        ON CONFLICT (product_item_code) DO UPDATE SET
          brand = EXCLUDED.brand,
          material_id = EXCLUDED.material_id,
          gsm = EXCLUDED.gsm,
          product_type = EXCLUDED.product_type
        RETURNING id
      `, [
        `PROD-${String(i).padStart(4, '0')}`,
        brand,
        materialId,
        gsm,
        productType,
        Math.random() > 0.5 ? 'FSC-100' : null,
        `Color: ${['Red', 'Blue', 'Green', 'Black', 'White'][Math.floor(Math.random() * 5)]}`,
        userIds['tom.anderson@horizonsourcing.com']
      ]);
      
      // For SQLite, we need to get the row using the insertId
      if (result.rows.length === 0 && result.insertId) {
        const productResult = await pool.query('SELECT id FROM products WHERE rowid = ?', [result.insertId]);
        productIds.push(productResult.rows[0].id);
      } else {
        productIds.push(result.rows[0].id);
      }
    }
    console.log(`✅ Created ${productIds.length} products`);

    // 5. Create job cards with punched_by data
    console.log('📋 Creating job cards...');
    const jobCardIds = [];
    const merchandiserIds = [userIds['tom.anderson@horizonsourcing.com']];
    
    for (let i = 1; i <= 60; i++) {
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const companyId = companyIds[Math.floor(Math.random() * companyIds.length)];
      const merchandiserId = merchandiserIds[Math.floor(Math.random() * merchandiserIds.length)];
      const status = JOB_STATUSES[Math.floor(Math.random() * JOB_STATUSES.length)];
      const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
      
      // Create dates in the past 3 months
      const punchedAt = new Date();
      punchedAt.setDate(punchedAt.getDate() - Math.floor(Math.random() * 90));
      
      const deliveryDate = new Date(punchedAt);
      deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 30) + 7);
      
      const result = await pool.query(`
        INSERT INTO job_cards (job_card_id, product_id, company_id, po_number, quantity, delivery_date, priority, status, progress, created_by, punched_by, punched_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (job_card_id) DO UPDATE SET
          product_id = EXCLUDED.product_id,
          company_id = EXCLUDED.company_id,
          status = EXCLUDED.status
        RETURNING id
      `, [
        `JC-${String(i).padStart(4, '0')}`,
        productId,
        companyId,
        `PO-${String(i).padStart(6, '0')}`,
        Math.floor(Math.random() * 10000) + 1000,
        deliveryDate,
        priority,
        status,
        status === 'COMPLETED' ? 100 : Math.floor(Math.random() * 80) + 10,
        merchandiserId,
        merchandiserId,
        punchedAt
      ]);
      
      // For SQLite, we need to get the row using the insertId
      if (result.rows.length === 0 && result.insertId) {
        // Get the actual job_card_id from the inserted row
        const jobCardResult = await pool.query('SELECT job_card_id FROM job_cards WHERE rowid = ?', [result.insertId]);
        if (jobCardResult.rows && jobCardResult.rows.length > 0) {
          jobCardIds.push(jobCardResult.rows[0].job_card_id);
        }
      } else {
        jobCardIds.push(result.rows[0].id);
      }
    }
    console.log(`✅ Created ${jobCardIds.length} job cards`);
    console.log('Job card IDs:', jobCardIds.slice(0, 5)); // Debug: show first 5 IDs

    // 6. Create prepress jobs
    console.log('🎨 Creating prepress jobs...');
    const designerIds = [
      userIds['emma.wilson@horizonsourcing.com'],
      userIds['james.brown@horizonsourcing.com'],
      userIds['lisa.garcia@horizonsourcing.com']
    ];
    
    for (let i = 0; i < 40; i++) {
      const jobCardId = jobCardIds[Math.floor(Math.random() * jobCardIds.length)];
      if (!jobCardId) {
        console.log('Skipping prepress job - no job card ID available');
        continue;
      }
      const status = PREPRESS_STATUSES[Math.floor(Math.random() * PREPRESS_STATUSES.length)];
      const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
      const assignedDesignerId = status !== 'PENDING' ? designerIds[Math.floor(Math.random() * designerIds.length)] : null;
      
      // Create dates
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 60));
      
      const dueDate = new Date(createdAt);
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 3);
      
      const startedAt = status === 'IN_PROGRESS' || status === 'PAUSED' || status === 'HOD_REVIEW' || status === 'COMPLETED' 
        ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) 
        : null;
        
      const completedAt = status === 'COMPLETED' 
        ? new Date((startedAt || createdAt).getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000)
        : null;

      const result = await pool.query(`
        INSERT INTO prepress_jobs (job_card_id, assigned_designer_id, status, priority, due_date, started_at, completed_at, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        jobCardId,
        assignedDesignerId,
        status,
        priority,
        dueDate,
        startedAt,
        completedAt,
        userIds['tom.anderson@horizonsourcing.com'], // Merchandiser user ID
        assignedDesignerId || userIds['tom.anderson@horizonsourcing.com']
      ]);
      
      // Create activity log entries
      if (assignedDesignerId) {
        await pool.query(`
          INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
          VALUES ($1, $2, 'ASSIGNED', 'PENDING', 'ASSIGNED', 'Initial assignment')
        `, [result.rows[0].id, userIds['alex.kumar@horizonsourcing.com']]);
      }
      
      if (startedAt) {
        await pool.query(`
          INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
          VALUES ($1, $2, 'STARTED', 'ASSIGNED', 'IN_PROGRESS', 'Work started')
        `, [result.rows[0].id, assignedDesignerId]);
      }
      
      if (completedAt) {
        await pool.query(`
          INSERT INTO prepress_activity (prepress_job_id, actor_id, action, from_status, to_status, remark)
          VALUES ($1, $2, 'COMPLETED', 'IN_PROGRESS', 'COMPLETED', 'Work completed')
        `, [result.rows[0].id, assignedDesignerId]);
      }
    }
    console.log(`✅ Created 40 prepress jobs with activity logs`);

    // 7. Create sample notifications
    console.log('🔔 Creating sample notifications...');
    const notificationTypes = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
    const notificationTitles = [
      'New job assigned',
      'Job deadline approaching',
      'Job completed',
      'SLA breach warning',
      'File uploaded',
      'Status updated',
      'Remark added',
      'Job reassigned'
    ];
    
    const availableUserIds = Object.values(userIds).filter(id => id !== null && id !== undefined);
    console.log('Available user IDs for notifications:', availableUserIds);
    
    for (let i = 0; i < 20; i++) {
      if (availableUserIds.length === 0) {
        console.log('Skipping notification - no user IDs available');
        continue;
      }
      const userId = availableUserIds[Math.floor(Math.random() * availableUserIds.length)];
      const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const title = notificationTitles[Math.floor(Math.random() * notificationTitles.length)];
      
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 7));
      
      await pool.query(`
        INSERT INTO notifications (user_id, title, body, type, link, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        title,
        `Sample notification body for ${title.toLowerCase()}`,
        type,
        '/prepress/jobs',
        createdAt
      ]);
    }
    console.log(`✅ Created 20 sample notifications`);

    // 8. Refresh materialized views (skip for SQLite)
    console.log('📊 Skipping materialized views refresh (not supported in SQLite)');

    console.log('🎉 Enhanced data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Users: ${users.length} (with enhanced roles)`);
    console.log(`- Companies: ${companies.length}`);
    console.log(`- Materials: ${materials.length}`);
    console.log(`- Products: ${productIds.length}`);
    console.log(`- Job Cards: ${jobCardIds.length} (with punched_by data)`);
    console.log(`- Prepress Jobs: 40 (with activity logs)`);
    console.log(`- Notifications: 20`);
    console.log('\n🔑 Login Credentials:');
    console.log('Admin: admin@horizonsourcing.com / admin123');
    console.log('Head of Merchandiser: sarah.chen@horizonsourcing.com / hom123');
    console.log('Head of Production: mike.rodriguez@horizonsourcing.com / hop123');
    console.log('HOD Prepress: alex.kumar@horizonsourcing.com / hod123');
    console.log('Designer: emma.wilson@horizonsourcing.com / designer123');
    console.log('Merchandiser: tom.anderson@horizonsourcing.com / merch123');

  } catch (error) {
    console.error('❌ Error seeding enhanced data:', error);
    throw error;
  }
}

// Run the seeding
seedEnhancedData().catch(console.error);
