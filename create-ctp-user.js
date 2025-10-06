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

async function createCTPUser() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Creating CTP user: adnanctp@horizonsourcing.net.pk');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['adnanctp@horizonsourcing.net.pk']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ User already exists. Updating password and role...');
      
      await client.query(`
        UPDATE users
        SET password = $1,
            role = 'CTP_OPERATOR',
            "firstName" = 'Adnan',
            "lastName" = 'CTP',
            "updatedAt" = NOW()
        WHERE email = $2
      `, [hashedPassword, 'adnanctp@horizonsourcing.net.pk']);
      
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
        'adnanctp',
        'adnanctp@horizonsourcing.net.pk',
        hashedPassword,
        'Adnan',
        'CTP',
        'CTP_OPERATOR'
      ]);
      
      console.log('✅ CTP user created successfully!');
    }
    
    // Verify the user
    const result = await client.query(`
      SELECT id, email, "firstName", "lastName", role
      FROM users
      WHERE email = $1
    `, ['adnanctp@horizonsourcing.net.pk']);
    
    console.log('\n📋 User Details:');
    console.log('----------------------------------------');
    console.log('ID:', result.rows[0].id);
    console.log('Email:', result.rows[0].email);
    console.log('Name:', result.rows[0].firstName, result.rows[0].lastName);
    console.log('Role:', result.rows[0].role);
    console.log('Password: password');
    console.log('----------------------------------------');
    
  } catch (error) {
    console.error('❌ Error creating CTP user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createCTPUser()
  .then(() => {
    console.log('\n✅ CTP user setup completed!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: adnanctp@horizonsourcing.net.pk');
    console.log('   Password: password');
    console.log('   Role: CTP_OPERATOR');
    console.log('\n🌐 Access CTP Dashboard at: http://localhost:8081/ctp/dashboard');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create CTP user:', error);
    process.exit(1);
  });

