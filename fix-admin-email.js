import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || process.env.PG_USER || 'erp_user',
  host: process.env.DB_HOST || process.env.PG_HOST || 'localhost',
  database: process.env.DB_NAME || process.env.PG_DATABASE || 'erp_merchandiser',
  password: process.env.DB_PASSWORD || process.env.PG_PASSWORD || 'DevPassword123!',
  port: process.env.DB_PORT || process.env.PG_PORT || 5432,
});

async function fixAdminEmail() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing admin user email...\n');
    
    // Check if admin@erp.local exists
    const oldAdmin = await client.query(
      'SELECT id, email, username FROM users WHERE email = $1 OR username = $2',
      ['admin@erp.local', 'admin']
    );
    
    if (oldAdmin.rows.length > 0) {
      const admin = oldAdmin.rows[0];
      console.log(`📋 Found existing admin user:`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Username: ${admin.username}`);
      
      // Update email to standardized format
      await client.query(
        'UPDATE users SET email = $1, "updatedAt" = NOW() WHERE id = $2',
        ['admin@horizonsourcing.com', admin.id]
      );
      
      console.log(`\n✅ Updated admin email to: admin@horizonsourcing.com`);
      
      // Verify
      const verify = await client.query(
        'SELECT id, email, username, role FROM users WHERE id = $1',
        [admin.id]
      );
      
      console.log(`\n📋 Updated Admin Details:`);
      console.log(`   Email: ${verify.rows[0].email}`);
      console.log(`   Username: ${verify.rows[0].username}`);
      console.log(`   Role: ${verify.rows[0].role}`);
      console.log(`   Password: admin123`);
      
    } else {
      // Create new admin if doesn't exist
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);
      
      await client.query(`
        INSERT INTO users (
          username, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt"
        ) VALUES (
          'admin', 'admin@horizonsourcing.com', $1, 'Admin', 'User', 'ADMIN', true, NOW(), NOW()
        )
      `, [hashedPassword]);
      
      console.log('✅ Created new admin user: admin@horizonsourcing.com');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin email:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminEmail()
  .then(() => {
    console.log('\n✅ Admin email fix completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to fix admin email:', error);
    process.exit(1);
  });

