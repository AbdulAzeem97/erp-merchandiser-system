/**
 * Script to verify kamran.khan@horizonsourcing.net.pk user exists
 * Run with: node verify-kamran-user.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'erp_merchandiser',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function verifyKamranUser() {
  console.log('\n👤 Verifying Kamran Khan User...\n');
  
  try {
    const result = await pool.query(`
      SELECT id, email, "firstName", "lastName", role, "isActive"
      FROM users
      WHERE email = 'kamran.khan@horizonsourcing.net.pk'
    `);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName || ''}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      
      // Check if role is correct
      if (user.role === 'HOD_PREPRESS') {
        console.log('\n✅ Role is correct: HOD_PREPRESS');
      } else {
        console.log(`\n⚠️  Role is ${user.role}, expected HOD_PREPRESS`);
        console.log('   Consider updating the role if needed.');
      }
      
      // Check if user is active
      if (user.isActive) {
        console.log('✅ User is active');
      } else {
        console.log('⚠️  User is NOT active - this may prevent them from appearing in dropdowns');
        console.log('   Consider updating isActive to true if needed.');
      }
      
      return true;
    } else {
      console.log('❌ User not found!');
      console.log('\n📝 To create the user, you can:');
      console.log('   1. Run the database setup script');
      console.log('   2. Or manually insert the user with:');
      console.log('      - Email: kamran.khan@horizonsourcing.net.pk');
      console.log('      - Role: HOD_PREPRESS');
      console.log('      - isActive: true');
      console.log('      - firstName: Kamran');
      console.log('      - lastName: Khan');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

verifyKamranUser()
  .then((exists) => {
    if (exists) {
      console.log('\n✅ Verification complete - user exists and is ready');
      process.exit(0);
    } else {
      console.log('\n⚠️  User needs to be created');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Script error:', error);
    process.exit(1);
  });
