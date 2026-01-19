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

// Helper function to parse name from email
function parseNameFromEmail(email) {
  const username = email.split('@')[0];
  
  // Special cases with known names
  const specialCases = {
    'cs10': { firstName: 'Fozan', lastName: 'Assistant' },
    'cs2': { firstName: 'Farman', lastName: 'Khan' },
    'cs8': { firstName: 'Zeeshan', lastName: 'Alam' },
    'cs3': { firstName: 'Daniyal', lastName: 'Saleem' },
    'cs13': { firstName: 'Talha', lastName: 'Hussain' },
    'cs5': { firstName: 'Usama', lastName: 'Assistant' },
    'cs14': { firstName: 'Nadeem', lastName: 'Ali' },
  };
  
  if (specialCases[username]) {
    return specialCases[username];
  }
  
  // Try to parse from email format like "first.last" or "firstname.lastname"
  const parts = username.split('.');
  if (parts.length >= 2) {
    const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const lastName = parts.slice(1).map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
    return { firstName, lastName };
  }
  
  // If no dots, use the whole username as first name
  const firstName = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  return { firstName, lastName: 'User' };
}

// Merchandiser users with hierarchy
const merchandiserUsers = [
  // Director (HEAD) - no manager
  {
    email: 'shahid.aazmi@horizonsourcing.net.pk',
    role: 'DIRECTOR',
    managerEmail: null,
  },
  
  // Senior Merchandisers (report to Director)
  {
    email: 'jaseem.akhtar@horizonsourcing.net.pk',
    role: 'SENIOR_MERCHANDISER',
    managerEmail: 'shahid.aazmi@horizonsourcing.net.pk',
  },
  {
    email: 'jahanzaib.taj@horizonsourcing.net.pk',
    role: 'SENIOR_MERCHANDISER',
    managerEmail: 'shahid.aazmi@horizonsourcing.net.pk',
  },
  {
    email: 'sajjad.mashkoor@horizonsourcing.net.pk',
    role: 'SENIOR_MERCHANDISER',
    managerEmail: 'shahid.aazmi@horizonsourcing.net.pk',
  },
  {
    email: 'abdullah@horizonsourcing.net.pk',
    role: 'SENIOR_MERCHANDISER',
    managerEmail: 'shahid.aazmi@horizonsourcing.net.pk',
  },
  
  // Assistant Merchandisers of Abdullah Ata
  {
    email: 'm.raza@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'abdullah@horizonsourcing.net.pk',
  },
  {
    email: 'zeeshan.ahmed@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'abdullah@horizonsourcing.net.pk',
  },
  {
    email: 'cs10@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'abdullah@horizonsourcing.net.pk',
  },
  
  // Assistant Merchandisers of Jahanzaib Taj
  {
    email: 'zuhair.zahid@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jahanzaib.taj@horizonsourcing.net.pk',
  },
  {
    email: 'hammad.hussain@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jahanzaib.taj@horizonsourcing.net.pk',
  },
  {
    email: 'sami.khan@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jahanzaib.taj@horizonsourcing.net.pk',
  },
  {
    email: 'cs3@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jahanzaib.taj@horizonsourcing.net.pk',
  },
  {
    email: 'syed.sohaib@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jahanzaib.taj@horizonsourcing.net.pk',
  },
  
  // Assistant Merchandisers of Jaseem
  {
    email: 'cs2@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jaseem.akhtar@horizonsourcing.net.pk',
  },
  {
    email: 'cs8@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jaseem.akhtar@horizonsourcing.net.pk',
  },
  {
    email: 'zohaib.ansari@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jaseem.akhtar@horizonsourcing.net.pk',
  },
  {
    email: 'abdul.rehman@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'jaseem.akhtar@horizonsourcing.net.pk',
  },
  
  // Assistant Merchandisers of Sajjad Mashkoor
  {
    email: 'cs13@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'sajjad.mashkoor@horizonsourcing.net.pk',
  },
  {
    email: 'cs5@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'sajjad.mashkoor@horizonsourcing.net.pk',
  },
  {
    email: 'fakhar.alam@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'sajjad.mashkoor@horizonsourcing.net.pk',
  },
  {
    email: 'adil.raza@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'sajjad.mashkoor@horizonsourcing.net.pk',
  },
  {
    email: 'cs14@horizonsourcing.net.pk',
    role: 'ASSISTANT_MERCHANDISER',
    managerEmail: 'sajjad.mashkoor@horizonsourcing.net.pk',
  },
];

// Default password for all users
const DEFAULT_PASSWORD = 'Password123';

async function createMerchandiserUsers() {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log('👥 Creating merchandiser users with hierarchy...\n');
    console.log(`📝 Default password for all users: ${DEFAULT_PASSWORD}\n`);
    
    // Add new roles to UserRole enum if they don't exist
    console.log('📝 Checking UserRole enum values...');
    try {
      const enumCheck = await client.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
        AND enumlabel IN ('DIRECTOR', 'SENIOR_MERCHANDISER', 'ASSISTANT_MERCHANDISER')
      `);
      
      const existingRoles = enumCheck.rows.map(r => r.enumlabel);
      const rolesToAdd = ['DIRECTOR', 'SENIOR_MERCHANDISER', 'ASSISTANT_MERCHANDISER'].filter(
        role => !existingRoles.includes(role)
      );
      
      if (rolesToAdd.length > 0) {
        console.log(`📝 Adding new roles to enum: ${rolesToAdd.join(', ')}...`);
        for (const role of rolesToAdd) {
          await client.query(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS '${role}'`);
        }
        console.log('✅ New roles added to enum\n');
      } else {
        console.log('✅ All required roles already exist in enum\n');
      }
    } catch (error) {
      console.log('⚠️  Could not add roles to enum (may not be an enum type):', error.message);
      console.log('   Continuing with role assignment...\n');
    }
    
    // Check if manager_id column exists, if not, add it
    try {
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'manager_id'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('📝 Adding manager_id column to users table...');
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS "manager_id" INTEGER REFERENCES users(id)
        `);
        console.log('✅ manager_id column added\n');
      }
    } catch (error) {
      console.log('⚠️  Could not add manager_id column (may already exist or table structure differs):', error.message);
    }
    
    // Hash password once
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    // Store created users by email for manager_id lookup
    const userMap = new Map();
    const results = [];
    
    // Process users in order (director first, then seniors, then assistants)
    for (const userData of merchandiserUsers) {
      try {
        const { firstName, lastName } = parseNameFromEmail(userData.email);
        const username = userData.email.split('@')[0];
        
        console.log(`📝 Processing: ${userData.email} (${userData.role})...`);
        
        // Get manager_id if managerEmail is provided
        let managerId = null;
        if (userData.managerEmail) {
          const manager = userMap.get(userData.managerEmail);
          if (manager) {
            managerId = manager.id;
            console.log(`   └─ Manager: ${userData.managerEmail} (ID: ${managerId})`);
          } else {
            // Try to find manager in database
            const managerResult = await client.query(
              'SELECT id FROM users WHERE email = $1',
              [userData.managerEmail]
            );
            if (managerResult.rows.length > 0) {
              managerId = managerResult.rows[0].id;
              console.log(`   └─ Manager found in DB: ${userData.managerEmail} (ID: ${managerId})`);
            } else {
              console.log(`   ⚠️  Warning: Manager ${userData.managerEmail} not found. Creating without manager_id.`);
            }
          }
        }
        
        // Check if user already exists
        const existingResult = await client.query(
          'SELECT id, email, username, role FROM users WHERE email = $1',
          [userData.email]
        );
        
        if (existingResult.rows.length > 0) {
          // User exists - update role and manager_id
          const existingUser = existingResult.rows[0];
          console.log(`   ⚠️  User already exists. Updating role and manager_id...`);
          
          // Build update query dynamically based on whether manager_id column exists
          const updateFields = [
            'role = $1',
            'password = $2',
            '"firstName" = $3',
            '"lastName" = $4',
            'username = $5',
            '"updatedAt" = NOW()'
          ];
          const updateParams = [
            userData.role,
            hashedPassword,
            firstName,
            lastName,
            username
          ];
          
          // Add manager_id if column exists
          let paramIndex = updateParams.length + 1;
          try {
            await client.query('SELECT "manager_id" FROM users LIMIT 1');
            updateFields.push(`"manager_id" = $${paramIndex}`);
            updateParams.push(managerId);
            paramIndex++;
          } catch (e) {
            // Column doesn't exist, skip it
          }
          
          updateParams.push(userData.email);
          
          await client.query(
            `UPDATE users 
             SET ${updateFields.join(', ')}
             WHERE email = $${paramIndex}`,
            updateParams
          );
          
          const updatedUser = {
            id: existingUser.id,
            email: userData.email,
            username,
            role: userData.role,
            managerId,
            firstName,
            lastName,
          };
          
          userMap.set(userData.email, updatedUser);
          results.push({ email: userData.email, status: 'updated', ...updatedUser });
          console.log(`   ✅ User updated: ${userData.email} (ID: ${updatedUser.id})`);
        } else {
          // Create new user - check if manager_id column exists
          let insertFields = 'username, email, password, "firstName", "lastName", role, "isActive", "createdAt", "updatedAt"';
          let insertValues = '$1, $2, $3, $4, $5, $6, true, NOW(), NOW()';
          let insertParams = [username, userData.email, hashedPassword, firstName, lastName, userData.role];
          let returningFields = 'id, email, username, role';
          
          // Try to include manager_id if column exists
          try {
            await client.query('SELECT "manager_id" FROM users LIMIT 1');
            insertFields = 'username, email, password, "firstName", "lastName", role, "manager_id", "isActive", "createdAt", "updatedAt"';
            insertValues = '$1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()';
            insertParams.push(managerId);
            returningFields = 'id, email, username, role, "manager_id"';
          } catch (e) {
            // Column doesn't exist, use fields without manager_id
          }
          
          const insertResult = await client.query(
            `INSERT INTO users (${insertFields})
             VALUES (${insertValues})
             RETURNING ${returningFields}`,
            insertParams
          );
          
          const newUser = insertResult.rows[0];
          const userInfo = {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
            managerId: newUser.manager_id || null,
            firstName,
            lastName,
          };
          
          userMap.set(userData.email, userInfo);
          results.push({ email: userData.email, status: 'created', ...userInfo });
          console.log(`   ✅ User created: ${userData.email} (ID: ${newUser.id})`);
        }
        
        console.log('');
      } catch (error) {
        console.error(`   ❌ Error processing ${userData.email}:`, error.message);
        results.push({ 
          email: userData.email, 
          status: 'error', 
          error: error.message 
        });
      }
    }
    
    // Verification: Display all created users
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION: All Merchandiser Users');
    console.log('='.repeat(80) + '\n');
    
    // Build verification query - check if manager_id column exists
    let verificationQuery = `
      SELECT u.id, u.email, u.username, u.role, u."firstName", u."lastName"
    `;
    
    try {
      await client.query('SELECT "manager_id" FROM users LIMIT 1');
      verificationQuery = `
        SELECT u.id, u.email, u.username, u.role, u."firstName", u."lastName", 
               u."manager_id", m.email as manager_email
        FROM users u
        LEFT JOIN users m ON u."manager_id" = m.id
      `;
    } catch (e) {
      verificationQuery = `
        SELECT u.id, u.email, u.username, u.role, u."firstName", u."lastName"
        FROM users u
      `;
    }
    
    verificationQuery += `
      WHERE u.email IN (${merchandiserUsers.map((_, i) => `$${i + 1}`).join(', ')})
      ORDER BY 
        CASE u.role::text
          WHEN 'DIRECTOR' THEN 1
          WHEN 'SENIOR_MERCHANDISER' THEN 2
          WHEN 'ASSISTANT_MERCHANDISER' THEN 3
          ELSE 4
        END,
        u.email
    `;
    
    const verificationResult = await client.query(
      verificationQuery,
      merchandiserUsers.map(u => u.email)
    );
    
    // Display table with or without manager column
    const hasManager = verificationResult.rows[0] && 'manager_email' in verificationResult.rows[0];
    
    if (hasManager) {
      console.log('┌────────────────────────────────────────────────────────────────────────────────────────┐');
      console.log('│ Email                                              │ Role                    │ Manager              │');
      console.log('├────────────────────────────────────────────────────────────────────────────────────────┤');
      
      for (const user of verificationResult.rows) {
        const email = (user.email || '').padEnd(50);
        const role = (user.role || '').padEnd(24);
        const manager = (user.manager_email || 'None').padEnd(20);
        console.log(`│ ${email} │ ${role} │ ${manager} │`);
      }
      
      console.log('└────────────────────────────────────────────────────────────────────────────────────────┘');
    } else {
      console.log('┌────────────────────────────────────────────────────────────────────────────────────┐');
      console.log('│ Email                                              │ Role                    │');
      console.log('├────────────────────────────────────────────────────────────────────────────────────┤');
      
      for (const user of verificationResult.rows) {
        const email = (user.email || '').padEnd(50);
        const role = (user.role || '').padEnd(24);
        console.log(`│ ${email} │ ${role} │`);
      }
      
      console.log('└────────────────────────────────────────────────────────────────────────────────────┘');
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));
    const created = results.filter(r => r.status === 'created').length;
    const updated = results.filter(r => r.status === 'updated').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Created: ${created}`);
    console.log(`🔄 Updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total: ${results.length}`);
    console.log(`\n🔑 Default password for all users: ${DEFAULT_PASSWORD}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createMerchandiserUsers()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

