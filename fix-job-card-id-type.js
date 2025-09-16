import dbAdapter from './server/database/adapter.js';

async function fixJobCardIdType() {
  try {
    console.log('🔧 Fixing job_lifecycle.job_card_id data type...');
    
    // Change job_card_id from character varying to uuid
    await dbAdapter.query('ALTER TABLE job_lifecycle ALTER COLUMN job_card_id TYPE uuid USING job_card_id::uuid');
    console.log('✅ Changed job_card_id to uuid type');
    
    // Now add the foreign key constraint
    await dbAdapter.query('ALTER TABLE job_lifecycle ADD CONSTRAINT job_lifecycle_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES job_cards(id)');
    console.log('✅ Added foreign key constraint');
    
    console.log('🎉 Data type and constraint fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing data type:', err.message);
    process.exit(1);
  }
}

fixJobCardIdType();
