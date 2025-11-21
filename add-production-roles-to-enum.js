import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addProductionRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding Production roles to UserRole enum...\n');
    
    // Check current enum values
    const currentEnum = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      ORDER BY enumsortorder
    `);
    
    console.log('📋 Current UserRole enum values:');
    currentEnum.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.enumlabel}`);
    });
    
    // Add HOD_PRODUCTION if it doesn't exist
    const hodProductionExists = currentEnum.rows.some(row => row.enumlabel === 'HOD_PRODUCTION');
    if (!hodProductionExists) {
      console.log('\n➕ Adding HOD_PRODUCTION to enum...');
      await client.query(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'HOD_PRODUCTION'`);
      console.log('✅ HOD_PRODUCTION added successfully!');
    } else {
      console.log('\n⚠️ HOD_PRODUCTION already exists in enum');
    }
    
    // Add PRODUCTION_OPERATOR if it doesn't exist
    const operatorExists = currentEnum.rows.some(row => row.enumlabel === 'PRODUCTION_OPERATOR');
    if (!operatorExists) {
      console.log('➕ Adding PRODUCTION_OPERATOR to enum...');
      await client.query(`ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PRODUCTION_OPERATOR'`);
      console.log('✅ PRODUCTION_OPERATOR added successfully!');
    } else {
      console.log('⚠️ PRODUCTION_OPERATOR already exists in enum');
    }
    
    // Verify updated enum values
    const updatedEnum = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      ORDER BY enumsortorder
    `);
    
    console.log('\n📋 Updated UserRole enum values:');
    updatedEnum.rows.forEach((row, index) => {
      const isNew = !currentEnum.rows.some(old => old.enumlabel === row.enumlabel);
      console.log(`   ${index + 1}. ${row.enumlabel}${isNew ? ' ✨ NEW' : ''}`);
    });
    
    console.log('\n✅ Production roles added to enum successfully!');
    
  } catch (error) {
    console.error('❌ Error adding production roles:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addProductionRoles()
  .then(() => {
    console.log('\n✅ Production roles setup completed!');
    console.log('\n📝 Next step: Run create-production-users.js to create users');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to add production roles:', error);
    process.exit(1);
  });

