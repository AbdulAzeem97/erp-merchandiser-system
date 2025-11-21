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

async function createHODCuttingUser() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Creating HOD Cutting user: cutting@horizonsourcing.net.pk');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['cutting@horizonsourcing.net.pk']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ User already exists. Updating password and role...');
      
      await client.query(`
        UPDATE users
        SET password = $1,
            role = 'HOD_CUTTING',
            "firstName" = 'HOD',
            "lastName" = 'Cutting',
            "updatedAt" = NOW()
        WHERE email = $2
      `, [hashedPassword, 'cutting@horizonsourcing.net.pk']);
      
      console.log('✅ User updated successfully!');
    } else {
      // Create new user
      await client.query(`
        INSERT INTO users (
          username, email, password, "firstName", "lastName", role, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
      `, [
        'hodcutting',
        'cutting@horizonsourcing.net.pk',
        hashedPassword,
        'HOD',
        'Cutting',
        'HOD_CUTTING'
      ]);
      
      console.log('✅ HOD Cutting user created successfully!');
    }
    
    // Verify the user
    const result = await client.query(`
      SELECT id, email, "firstName", "lastName", role
      FROM users
      WHERE email = $1
    `, ['cutting@horizonsourcing.net.pk']);
    
    console.log('\n📋 User Details:');
    console.log('----------------------------------------');
    console.log('ID:', result.rows[0].id);
    console.log('Email:', result.rows[0].email);
    console.log('Name:', result.rows[0].firstName, result.rows[0].lastName);
    console.log('Role:', result.rows[0].role);
    console.log('Password: password');
    console.log('----------------------------------------');
    
  } catch (error) {
    console.error('❌ Error creating HOD Cutting user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createHODCuttingUser()
  .then(() => {
    console.log('\n✅ HOD Cutting user setup completed!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: cutting@horizonsourcing.net.pk');
    console.log('   Password: password');
    console.log('   Role: HOD_CUTTING');
    console.log('\n🌐 Access Cutting Dashboard at: /cutting/dashboard');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create HOD Cutting user:', error);
    process.exit(1);
  });

