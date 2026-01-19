import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Database connection
const getPool = () => {
  const user = process.env.DB_USER || process.env.PG_USER || 'erp_user';
  const host = process.env.DB_HOST || process.env.PG_HOST || 'localhost';
  const database = process.env.DB_NAME || process.env.PG_DATABASE || 'erp_merchandiser';
  const password = process.env.DB_PASSWORD || process.env.PG_PASSWORD || 'secure_password_123';
  const port = process.env.DB_PORT || process.env.PG_PORT || 5432;

  return new Pool({
    user,
    host,
    database,
    password,
    port: parseInt(port),
  });
};

const pool = getPool();

const DEFAULT_PASSWORD = 'Password123';

async function ensureRoleExists(roleName) {
  try {
    const result = await pool.query(`
      SELECT 1 FROM pg_type WHERE typname = 'UserRole' 
      AND EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = $1 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      )
    `, [roleName]);
    
    if (result.rows.length === 0) {
      console.log(`Adding role ${roleName} to UserRole enum...`);
      await pool.query(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS '${roleName}'`);
      console.log(`✅ Role ${roleName} added to enum`);
    } else {
      console.log(`✅ Role ${roleName} already exists in enum`);
    }
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.log(`✅ Role ${roleName} already exists in enum`);
    } else {
      console.error(`Error checking/adding role ${roleName}:`, error.message);
      throw error;
    }
  }
}

async function createUser(email, firstName, lastName, role) {
  const username = email.split('@')[0];
  
  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email, "firstName", "lastName", role FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      console.log(`⚠️  User ${email} already exists:`);
      console.log(`   ID: ${user.id}, Name: ${fullName}, Role: ${user.role}`);
      
      // Update role and name if needed
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (user.role !== role) {
        updateFields.push(`role = $${paramIndex++}`);
        updateValues.push(role);
      }
      
      if (user.firstName !== firstName || user.lastName !== lastName) {
        updateFields.push(`"firstName" = $${paramIndex++}`);
        updateFields.push(`"lastName" = $${paramIndex++}`);
        updateValues.push(firstName, lastName);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(user.id);
        await pool.query(
          `UPDATE users SET ${updateFields.join(', ')}, "updatedAt" = NOW() WHERE id = $${paramIndex}`,
          updateValues
        );
        console.log(`   ✅ Updated: role=${role}, name=${firstName} ${lastName}`);
      }
      
      return user.id;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    // Create new user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", role`,
      [username, email, hashedPassword, firstName, lastName, role]
    );
    
    const user = result.rows[0];
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    console.log(`✅ Created user: ${fullName} (${user.email})`);
    console.log(`   ID: ${user.id}, Role: ${user.role}`);
    return user.id;
  } catch (error) {
    console.error(`❌ Error creating/updating user ${email}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Offset HOD user creation...\n');
    
    // Ensure roles exist
    console.log('Checking/adding roles to UserRole enum...');
    await ensureRoleExists('HOD_OFFSET');
    await ensureRoleExists('OFFSET_OPERATOR');
    console.log('');
    
    // Create Mr Nasir as HOD_OFFSET
    const users = [
      { 
        email: 'nasir@horizonsourcing.net.pk', 
        firstName: 'Nasir', 
        lastName: '', 
        role: 'HOD_OFFSET' 
      }
    ];
    
    console.log('Creating Offset HOD user...\n');
    
    for (const user of users) {
      await createUser(user.email, user.firstName, user.lastName, user.role);
      console.log('');
    }
    
    // Verify all users
    console.log('\n📊 Verification - All Offset HOD Users:');
    const verifyResult = await pool.query(`
      SELECT id, email, "firstName", "lastName", role, "isActive"
      FROM users 
      WHERE role = 'HOD_OFFSET'
      ORDER BY "firstName", "lastName"
    `);
    
    console.table(verifyResult.rows.map(row => ({
      ID: row.id,
      Email: row.email,
      Name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'N/A',
      Role: row.role,
      Active: row.isActive ? 'Yes' : 'No'
    })));
    
    console.log('\n✅ Offset HOD user creation completed!');
    console.log(`\n📝 Credentials for Mr Nasir:`);
    console.log(`   Email: nasir@horizonsourcing.net.pk`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log(`   Role: HOD_OFFSET`);
    console.log('⚠️  Please change password after first login.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();



