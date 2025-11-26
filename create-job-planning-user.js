import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function createJobPlanningUser() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Creating Job Planning user: jobplanning@horizonsourcing.com');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('jobplanning123', 10);
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['jobplanning@horizonsourcing.com']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ User already exists. Updating password and role...');
      
      await client.query(`
        UPDATE users
        SET password = $1,
            role = 'HEAD_OF_PRODUCTION',
            "firstName" = 'Job',
            "lastName" = 'Planning',
            username = 'jobplanning',
            "isActive" = TRUE,
            "updatedAt" = NOW()
        WHERE email = $2
      `, [hashedPassword, 'jobplanning@horizonsourcing.com']);
      
      console.log('✅ User updated successfully!');
    } else {
      // Create new user
      await client.query(`
        INSERT INTO users (
          username, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW()
        )
      `, [
        'jobplanning',
        'jobplanning@horizonsourcing.com',
        hashedPassword,
        'Job',
        'Planning',
        'HEAD_OF_PRODUCTION'
      ]);
      
      console.log('✅ Job Planning user created successfully!');
    }
    
    // Verify the user
    const result = await client.query(`
      SELECT id, email, username, "firstName", "lastName", role, "isActive"
      FROM users
      WHERE email = $1
    `, ['jobplanning@horizonsourcing.com']);
    
    console.log('\n📋 User Details:');
    console.log('----------------------------------------');
    console.log('Email:', result.rows[0].email);
    console.log('Username:', result.rows[0].username);
    console.log('Name:', result.rows[0].firstName, result.rows[0].lastName);
    console.log('Role:', result.rows[0].role);
    console.log('User ID:', result.rows[0].id);
    console.log('Active:', result.rows[0].isActive);
    console.log('\n🔐 Login Credentials:');
    console.log('----------------------------------------');
    console.log('Email/Username: jobplanning@horizonsourcing.com');
    console.log('Password: jobplanning123');
    console.log('\n📊 Dashboard URL:');
    console.log('----------------------------------------');
    console.log('http://localhost:5173/production/smart-dashboard');
    console.log('\n✅ Job Planning user is ready to use!');
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createJobPlanningUser()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

