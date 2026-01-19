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

// Helper function to parse name from email
function parseNameFromEmail(email) {
  const localPart = email.split('@')[0];
  
  // Handle special cases
  if (localPart === 'cs9') {
    return { firstName: 'Shahriyar', lastName: '' };
  }
  
  // For muhammad.rizwan@horizonsourcing.net.pk
  if (localPart === 'muhammad.rizwan') {
    return { firstName: 'Muhammad', lastName: 'Rizwan' };
  }
  
  // Default: capitalize first letter
  const parts = localPart.split('.');
  const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const lastName = parts.length > 1 
    ? parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
    : '';
  
  return { firstName, lastName };
}

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
    }
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`Role ${roleName} already exists in enum`);
    } else {
      throw error;
    }
  }
}

async function ensureManagerIdColumnExists() {
  try {
    await pool.query(`
      SELECT manager_id FROM users LIMIT 1
    `);
    console.log('✅ manager_id column already exists');
  } catch (error) {
    console.log('Adding manager_id column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id)
    `);
    console.log('✅ manager_id column added');
  }
}

async function getDirectorId() {
  const result = await pool.query(`
    SELECT id FROM users 
    WHERE role = 'DIRECTOR' 
    ORDER BY id ASC 
    LIMIT 1
  `);
  
  if (result.rows.length === 0) {
    throw new Error('No Director found. Please create a Director first.');
  }
  
  return result.rows[0].id;
}

async function createUser(email, role, managerId = null) {
  const { firstName, lastName } = parseNameFromEmail(email);
  const username = email.split('@')[0];
  
  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id, email, "firstName", "lastName", role, "manager_id" FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      console.log(`⚠️  User ${email} already exists:`);
      console.log(`   ID: ${user.id}, Name: ${fullName}, Role: ${user.role}`);
      
      // Update role and manager if needed
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (user.role !== role) {
        updateFields.push(`role = $${paramIndex++}`);
        updateValues.push(role);
      }
      
      if (managerId && user.manager_id !== managerId) {
        updateFields.push(`"manager_id" = $${paramIndex++}`);
        updateValues.push(managerId);
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
        console.log(`   ✅ Updated: role=${role}, manager_id=${managerId || 'null'}, name=${firstName} ${lastName}`);
      }
      
      return user.id;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    // Create new user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, "firstName", "lastName", role, "manager_id", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
       RETURNING id, email, "firstName", "lastName", role`,
      [username, email, hashedPassword, firstName, lastName, role, managerId]
    );
    
    const user = result.rows[0];
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    console.log(`✅ Created user: ${fullName} (${user.email})`);
    console.log(`   ID: ${user.id}, Role: ${user.role}, Manager ID: ${managerId || 'null'}`);
    return user.id;
  } catch (error) {
    console.error(`❌ Error creating/updating user ${email}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Senior Merchandiser user creation...\n');
    
    // Ensure role exists
    await ensureRoleExists('SENIOR_MERCHANDISER');
    
    // Ensure manager_id column exists
    await ensureManagerIdColumnExists();
    
    // Get Director ID (manager for Senior Merchandisers)
    const directorId = await getDirectorId();
    console.log(`📋 Director ID: ${directorId}\n`);
    
    // Create users
    const users = [
      { email: 'cs9@horizonsourcing.net.pk', role: 'SENIOR_MERCHANDISER' },
      { email: 'muhammad.rizwan@horizonsourcing.net.pk', role: 'SENIOR_MERCHANDISER' }
    ];
    
    console.log('Creating Senior Merchandiser users...\n');
    
    for (const user of users) {
      await createUser(user.email, user.role, directorId);
      console.log('');
    }
    
    // Verify all users
    console.log('\n📊 Verification - All Senior Merchandisers:');
    const verifyResult = await pool.query(`
      SELECT id, email, "firstName", "lastName", role, "manager_id",
             (SELECT "firstName" || ' ' || "lastName" FROM users WHERE id = users."manager_id") as manager_name
      FROM users 
      WHERE role = 'SENIOR_MERCHANDISER'
      ORDER BY "firstName", "lastName"
    `);
    
    console.table(verifyResult.rows.map(row => ({
      ID: row.id,
      Email: row.email,
      Name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      Role: row.role,
      'Manager ID': row.manager_id,
      'Manager Name': row.manager_name || 'N/A'
    })));
    
    console.log('\n✅ Senior Merchandiser user creation completed!');
    console.log(`\n📝 Default password for all users: ${DEFAULT_PASSWORD}`);
    console.log('⚠️  Please change passwords after first login.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

