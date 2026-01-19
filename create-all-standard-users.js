import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcryptjs';

// Database connection - tries multiple credentials
const getPool = () => {
  // Try environment variables first
  const user = process.env.DB_USER || process.env.PG_USER || 'erp_user';
  const host = process.env.DB_HOST || process.env.PG_HOST || 'localhost';
  const database = process.env.DB_NAME || process.env.PG_DATABASE || 'erp_merchandiser';
  const password = process.env.DB_PASSWORD || process.env.PG_PASSWORD || 'DevPassword123!';
  const port = process.env.DB_PORT || process.env.PG_PORT || 5432;

  return new Pool({
    user,
    host,
    database,
    password,
    port: parseInt(port),
  });
};

// All standardized users from COMPLETE-USERS-LIST.md
const standardUsers = [
  {
    email: 'admin@horizonsourcing.com',
    password: 'admin123',
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'User',
    username: 'admin',
    department: 'Administration'
  },
  {
    email: 'hod.prepress@horizonsourcing.com',
    password: 'hod123',
    role: 'HOD_PREPRESS',
    firstName: 'HOD',
    lastName: 'Prepress',
    username: 'hodprepress',
    department: 'Prepress'
  },
  {
    email: 'designer@horizonsourcing.com',
    password: 'designer123',
    role: 'DESIGNER',
    firstName: 'Designer',
    lastName: 'User',
    username: 'designer',
    department: 'Prepress'
  },
  {
    email: 'qa.prepress@horizonsourcing.com',
    password: 'qa123',
    role: 'QA_PREPRESS',
    firstName: 'QA',
    lastName: 'Prepress',
    username: 'qaprepress',
    department: 'Quality Assurance'
  },
  {
    email: 'ctp.operator@horizonsourcing.com',
    password: 'ctp123',
    role: 'CTP_OPERATOR',
    firstName: 'CTP',
    lastName: 'Operator',
    username: 'ctpoperator',
    department: 'Prepress'
  },
  {
    email: 'inventory.manager@horizonsourcing.com',
    password: 'inventory123',
    role: 'INVENTORY_MANAGER',
    firstName: 'Inventory',
    lastName: 'Manager',
    username: 'inventorymanager',
    department: 'Inventory'
  },
  {
    email: 'procurement.manager@horizonsourcing.com',
    password: 'procurement123',
    role: 'PROCUREMENT_MANAGER',
    firstName: 'Procurement',
    lastName: 'Manager',
    username: 'procurementmanager',
    department: 'Procurement'
  },
  // Additional user from original request
  {
    email: 'designing3@horizonsourcing.net.pk',
    password: 'designer123',
    role: 'DESIGNER',
    firstName: 'Designer',
    lastName: '3',
    username: 'designing3',
    department: 'Prepress'
  }
];

async function createAllUsers() {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log('👥 Creating all standardized users from COMPLETE-USERS-LIST.md\n');
    
    const results = [];
    
    for (const userData of standardUsers) {
      try {
        console.log(`📝 Processing: ${userData.email}...`);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Check if user already exists by email
        const existingByEmail = await client.query(
          'SELECT id, email, username FROM users WHERE email = $1',
          [userData.email]
        );
        
        // Check if username already exists
        const existingByUsername = await client.query(
          'SELECT id, email, username FROM users WHERE username = $1',
          [userData.username]
        );
        
        if (existingByEmail.rows.length > 0) {
          // User exists by email - update it
          console.log(`⚠️  User already exists. Updating password and details...`);
          
          // Check if username and department columns exist
          let updateQuery = `
            UPDATE users
            SET password = $1,
                role = $2,
                "firstName" = $3,
                "lastName" = $4,
                "updatedAt" = NOW()
          `;
          
          const updateParams = [
            hashedPassword,
            userData.role,
            userData.firstName,
            userData.lastName,
            userData.email
          ];
          
          // Update username if column exists
          try {
            await client.query(`
              UPDATE users
              SET username = $1
              WHERE email = $2
            `, [userData.username, userData.email]);
          } catch (e) {
            // Username column might not exist, continue
            console.log('   (Skipping username update - column may not exist)');
          }
          
          // Try to update department if column exists
          try {
            await client.query(`
              UPDATE users
              SET department = $1
              WHERE email = $2
            `, [userData.department, userData.email]);
          } catch (e) {
            // Department column might not exist, continue
            console.log('   (Skipping department update - column may not exist)');
          }
          
          await client.query(
            updateQuery + ` WHERE email = $${updateParams.length}`,
            updateParams
          );
          
          console.log(`✅ User updated: ${userData.email}`);
          results.push({ email: userData.email, status: 'updated', ...userData });
        } else if (existingByUsername.rows.length > 0) {
          // Username exists but email is different - skip to avoid conflict
          console.log(`⚠️  Username '${userData.username}' already exists with email '${existingByUsername.rows[0].email}'. Skipping creation of ${userData.email}...`);
          results.push({ email: userData.email, status: 'skipped', reason: 'Username already exists', ...userData });
        } else {
          // Create new user - always include username if possible
          try {
            await client.query(`
              INSERT INTO users (
                username, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt"
              ) VALUES (
                $1, $2, $3, $4, $5, $6, true, NOW(), NOW()
              )
            `, [
              userData.username,
              userData.email,
              hashedPassword,
              userData.firstName,
              userData.lastName,
              userData.role
            ]);
            console.log(`✅ User created: ${userData.email}`);
            results.push({ email: userData.email, status: 'created', ...userData });
          } catch (insertError) {
            console.error(`❌ Failed to create user ${userData.email}:`, insertError.message);
            results.push({ email: userData.email, status: 'error', error: insertError.message, ...userData });
          }
        }
        
        // Verify the user was created/updated
        const verifyResult = await client.query(`
          SELECT id, email, "firstName", "lastName", role, "isActive"
          FROM users
          WHERE email = $1
        `, [userData.email]);
        
        if (verifyResult.rows.length > 0) {
          const user = verifyResult.rows[0];
          console.log(`   ✓ Verified: ${user.email} (${user.role}) - Active: ${user.isActive}\n`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${userData.email}:`, error.message);
        results.push({ email: userData.email, status: 'error', error: error.message });
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY - All Users Created/Updated');
    console.log('='.repeat(60));
    
    const created = results.filter(r => r.status === 'created');
    const updated = results.filter(r => r.status === 'updated');
    const errors = results.filter(r => r.status === 'error');
    
    console.log(`\n✅ Created: ${created.length}`);
    console.log(`🔄 Updated: ${updated.length}`);
    if (errors.length > 0) {
      console.log(`❌ Errors: ${errors.length}`);
    }
    
    console.log('\n📋 All Users:');
    console.log('-'.repeat(60));
    results.forEach((result, index) => {
      const statusIcon = result.status === 'created' ? '✅' : result.status === 'updated' ? '🔄' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${result.email}`);
      console.log(`   Role: ${result.role} | Password: ${result.password}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🔐 Login Credentials:');
    console.log('='.repeat(60));
    results.forEach((result) => {
      if (result.status !== 'error') {
        console.log(`\n${result.email}`);
        console.log(`   Password: ${result.password}`);
        console.log(`   Role: ${result.role}`);
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createAllUsers()
  .then(() => {
    console.log('\n✅ All users setup completed successfully!');
    console.log('\n🌐 Access the system at: http://localhost:8080');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create users:', error);
    process.exit(1);
  });

