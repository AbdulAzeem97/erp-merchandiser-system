import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function addCTPRole() {
  const client = await pool.connect();
  
  try {
    console.log('📝 Adding CTP_OPERATOR to UserRole enum...');
    
    // Add new role to enum
    await client.query(`
      ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CTP_OPERATOR';
    `);
    
    console.log('✅ CTP_OPERATOR role added successfully!');
    
    // Verify
    const result = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      ORDER BY enumsortorder
    `);
    
    console.log('\n📋 All Available Roles:');
    result.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });
    
  } catch (error) {
    console.error('❌ Error adding CTP role:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCTPRole()
  .then(() => {
    console.log('\n✅ CTP role setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to add CTP role:', error);
    process.exit(1);
  });

