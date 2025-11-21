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

async function createProductionUsers() {
  const client = await pool.connect();
  
  try {
    console.log('👤 Creating Production Department Users...\n');
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password', 10);
    
    // 1. Create HOD Production
    console.log('📝 Creating HOD Production user: production@horizonsourcing.net.pk');
    
    const existingHOD = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['production@horizonsourcing.net.pk']
    );
    
    if (existingHOD.rows.length > 0) {
      console.log('⚠️ HOD Production user already exists. Updating password and role...');
      
      await client.query(`
        UPDATE users
        SET password = $1,
            role = 'HOD_PRODUCTION',
            "firstName" = 'HOD',
            "lastName" = 'Production',
            "updatedAt" = NOW()
        WHERE email = $2
      `, [hashedPassword, 'production@horizonsourcing.net.pk']);
      
      console.log('✅ HOD Production user updated successfully!');
    } else {
      await client.query(`
        INSERT INTO users (
          username, email, password, "firstName", "lastName", role, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
      `, [
        'hodproduction',
        'production@horizonsourcing.net.pk',
        hashedPassword,
        'HOD',
        'Production',
        'HOD_PRODUCTION'
      ]);
      
      console.log('✅ HOD Production user created successfully!');
    }
    
    // 2. Create Production Operator
    console.log('\n📝 Creating Production Operator user: production.operator@horizonsourcing.net.pk');
    
    const existingOperator = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['production.operator@horizonsourcing.net.pk']
    );
    
    if (existingOperator.rows.length > 0) {
      console.log('⚠️ Production Operator user already exists. Updating password and role...');
      
      await client.query(`
        UPDATE users
        SET password = $1,
            role = 'PRODUCTION_OPERATOR',
            "firstName" = 'Production',
            "lastName" = 'Operator',
            "updatedAt" = NOW()
        WHERE email = $2
      `, [hashedPassword, 'production.operator@horizonsourcing.net.pk']);
      
      console.log('✅ Production Operator user updated successfully!');
    } else {
      await client.query(`
        INSERT INTO users (
          username, email, password, "firstName", "lastName", role, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW(), NOW()
        )
      `, [
        'productionoperator',
        'production.operator@horizonsourcing.net.pk',
        hashedPassword,
        'Production',
        'Operator',
        'PRODUCTION_OPERATOR'
      ]);
      
      console.log('✅ Production Operator user created successfully!');
    }
    
    // Verify users
    console.log('\n📋 Verifying Production Users...\n');
    
    const hodResult = await client.query(`
      SELECT id, email, "firstName", "lastName", role
      FROM users
      WHERE email = $1
    `, ['production@horizonsourcing.net.pk']);
    
    const operatorResult = await client.query(`
      SELECT id, email, "firstName", "lastName", role
      FROM users
      WHERE email = $1
    `, ['production.operator@horizonsourcing.net.pk']);
    
    console.log('========================================');
    console.log('  PRODUCTION DEPARTMENT USERS');
    console.log('========================================\n');
    
    if (hodResult.rows.length > 0) {
      const hod = hodResult.rows[0];
      console.log('👔 HOD PRODUCTION:');
      console.log('   ID:', hod.id);
      console.log('   Email:', hod.email);
      console.log('   Name:', hod.firstName, hod.lastName);
      console.log('   Role:', hod.role);
      console.log('   Password: password');
      console.log('   Dashboard: /production/dashboard');
      console.log('');
    }
    
    if (operatorResult.rows.length > 0) {
      const operator = operatorResult.rows[0];
      console.log('👷 PRODUCTION OPERATOR:');
      console.log('   ID:', operator.id);
      console.log('   Email:', operator.email);
      console.log('   Name:', operator.firstName, operator.lastName);
      console.log('   Role:', operator.role);
      console.log('   Password: password');
      console.log('   Dashboard: /production/labor (View-Only)');
      console.log('');
    }
    
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Error creating production users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createProductionUsers()
  .then(() => {
    console.log('\n✅ Production users setup completed!');
    console.log('\n🔐 Login Credentials:');
    console.log('\n   HOD PRODUCTION:');
    console.log('   Email: production@horizonsourcing.net.pk');
    console.log('   Password: password');
    console.log('   Role: HOD_PRODUCTION');
    console.log('   Access: Full Production Dashboard');
    console.log('\n   PRODUCTION OPERATOR:');
    console.log('   Email: production.operator@horizonsourcing.net.pk');
    console.log('   Password: password');
    console.log('   Role: PRODUCTION_OPERATOR');
    console.log('   Access: View-Only Labor Dashboard');
    console.log('\n🌐 Production Dashboard: /production/dashboard');
    console.log('🌐 Production Labor View: /production/labor');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create production users:', error);
    process.exit(1);
  });

