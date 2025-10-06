import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'erp_user',
  host: 'localhost',
  database: 'erp_merchandiser',
  password: 'DevPassword123!',
  port: 5432,
});

async function checkUserRoles() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      ORDER BY enumsortorder
    `);
    
    console.log('Available UserRole values:');
    result.rows.forEach(row => {
      console.log(`  - ${row.enumlabel}`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserRoles();

