/**
 * Create Production User for Smart Production Dashboard
 * Email: production@horizonsourcing.com
 * Password: password
 * Role: PRODUCTION_MANAGER
 */

import bcrypt from 'bcryptjs';
import dbAdapter from './server/database/adapter.js';

async function createProductionUser() {
  try {
    console.log('🔐 Creating production user...');
    
    // Hash the password
    const passwordHash = await bcrypt.hash('password', 10);
    console.log('✅ Password hashed');
    
    // First, check the actual table structure
    const tableInfo = await dbAdapter.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table structure:');
    tableInfo.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // Try to create user - check if department column exists
    let result;
    try {
      // Try with department first
      result = await dbAdapter.query(`
        INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET 
          role = $5,
          password = $4,
          "isActive" = $7
        RETURNING id, email, role
      `, [
        'Production',
        'User',
        'production@horizonsourcing.com',
        passwordHash,
        'PRODUCTION_MANAGER',
        'Production',
        true
      ]);
    } catch (error) {
      // If department doesn't exist, try without it
      if (error.message.includes('department')) {
        console.log('⚠️  Department column not found, creating user without it...');
        // Check available roles first
        const rolesResult = await dbAdapter.query(`
          SELECT unnest(enum_range(NULL::"UserRole")) as role
        `);
        console.log('📋 Available roles:');
        rolesResult.rows.forEach(row => console.log(`   - ${row.role}`));
        
        // Use PRODUCTION_HEAD if PRODUCTION_MANAGER doesn't exist, or ADMIN for full access
        let userRole = 'PRODUCTION_HEAD';
        const availableRoles = rolesResult.rows.map(r => r.role);
        if (availableRoles.includes('PRODUCTION_MANAGER')) {
          userRole = 'PRODUCTION_MANAGER';
        } else if (availableRoles.includes('ADMIN')) {
          // ADMIN has access to everything, so use it
          userRole = 'ADMIN';
          console.log('⚠️  PRODUCTION_MANAGER role not found, using ADMIN for full access');
        }
        
        // Use HEAD_OF_PRODUCTION which should have access, or ADMIN
        if (availableRoles.includes('HEAD_OF_PRODUCTION')) {
          userRole = 'HEAD_OF_PRODUCTION';
          console.log('✅ Using HEAD_OF_PRODUCTION role (has Smart Production Dashboard access)');
        }
        
        result = await dbAdapter.query(`
          INSERT INTO users (username, "firstName", "lastName", email, password, role, "isActive", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO UPDATE SET 
            role = $6,
            password = $5,
            "isActive" = $7,
            "updatedAt" = CURRENT_TIMESTAMP
          RETURNING id, email, role
        `, [
          'production',
          'Production',
          'User',
          'production@horizonsourcing.com',
          passwordHash,
          userRole,
          true
        ]);
      } else {
        throw error;
      }
    }
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User created/updated successfully!');
      console.log('📋 User Details:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Department: ${user.department}`);
      console.log('\n🔑 Login Credentials:');
      console.log(`   Email: production@horizonsourcing.com`);
      console.log(`   Password: password`);
      console.log('\n🚀 Access URL: http://localhost:5173/production/smart-dashboard');
    } else {
      console.log('⚠️  User creation failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

// Initialize database adapter and create user
(async () => {
  try {
    // Set environment variables for database connection
    process.env.DB_USER = 'erp_user';
    process.env.DB_PASSWORD = 'DevPassword123!';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'erp_merchandiser';
    process.env.DB_PORT = '5432';
    
    await dbAdapter.initialize();
    await createProductionUser();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
})();

