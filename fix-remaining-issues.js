import dbAdapter from './server/database/adapter.js';

async function fixRemainingIssues() {
  try {
    console.log('🔧 Fixing remaining issues...');
    
    // Add user_id column to prepress_activities
    await dbAdapter.query('ALTER TABLE prepress_activities ADD COLUMN IF NOT EXISTS user_id TEXT');
    console.log('✅ Added user_id column to prepress_activities');
    
    // Check what field has character varying(20) constraint
    const varchar20Fields = await dbAdapter.query(`
      SELECT table_name, column_name, character_maximum_length
      FROM information_schema.columns 
      WHERE data_type = 'character varying' AND character_maximum_length = 20
      ORDER BY table_name, column_name
    `);
    
    console.log('Fields with varchar(20) constraint:', varchar20Fields.rows);
    
    // Increase the length of these fields
    for (const field of varchar20Fields.rows) {
      await dbAdapter.query(`
        ALTER TABLE ${field.table_name} 
        ALTER COLUMN ${field.column_name} TYPE character varying(255)
      `);
      console.log(`✅ Increased ${field.table_name}.${field.column_name} to varchar(255)`);
    }
    
    console.log('🎉 Remaining issues fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing issues:', err.message);
    process.exit(1);
  }
}

fixRemainingIssues();
