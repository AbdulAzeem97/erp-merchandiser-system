import dbAdapter from './server/database/adapter.js';

async function checkRoleConstraint() {
  try {
    const result = await dbAdapter.query(`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'users_role_check'
    `);
    
    console.log('Role constraint:', result.rows[0]);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkRoleConstraint();
