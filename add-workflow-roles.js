/**
 * Script to add new workflow roles to the database
 * Adds: HOD_FINISHING, FINISHING_OPERATOR, HOD_LOGISTICS, LOGISTICS_OPERATOR, EXTERNAL_OPERATOR
 */

import dbAdapter from './server/database/adapter.js';

const newRoles = [
  'HOD_FINISHING',
  'FINISHING_OPERATOR',
  'HOD_LOGISTICS',
  'LOGISTICS_OPERATOR',
  'EXTERNAL_OPERATOR'
];

async function addWorkflowRoles() {
  try {
    console.log('🔄 Adding new workflow roles to database...\n');

    // Check if users.role is an enum or text/varchar
    const columnCheck = await dbAdapter.query(`
      SELECT data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'role'
    `);

    const roleColumn = columnCheck.rows[0];
    
    if (!roleColumn) {
      console.error('❌ Could not find role column in users table');
      return;
    }

    console.log(`📋 Role column type: ${roleColumn.data_type} (${roleColumn.udt_name})`);

    // If it's an enum, try to add values
    if (roleColumn.udt_name === 'userrole' || roleColumn.data_type === 'USER_DEFINED') {
      console.log('📝 Role column appears to be an enum, attempting to add new values...');
      
      for (const role of newRoles) {
        try {
          // Try to add to enum (PostgreSQL)
          await dbAdapter.query(`
            DO $$ 
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_enum 
                WHERE enumlabel = $1 
                AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userrole')
              ) THEN
                ALTER TYPE userrole ADD VALUE $1;
              END IF;
            END $$;
          `, [role]);
          console.log(`✅ Added role: ${role}`);
        } catch (error: any) {
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log(`ℹ️  Role ${role} already exists`);
          } else {
            console.log(`⚠️  Could not add role ${role}: ${error.message}`);
          }
        }
      }
    } else {
      // If it's text/varchar, roles are just strings - no need to modify enum
      console.log('ℹ️  Role column is text/varchar - roles can be used directly without enum modification');
      console.log('✅ New roles can be assigned to users:');
      newRoles.forEach(role => console.log(`   - ${role}`));
    }

    console.log('\n✅ Workflow roles setup completed!');
  } catch (error) {
    console.error('❌ Error adding workflow roles:', error);
    throw error;
  }
}

// Run the script
addWorkflowRoles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
