import dbAdapter from './server/database/adapter.js';

async function fixPrepressDataTypes() {
  try {
    console.log('🔧 Fixing prepress_jobs data types...');
    
    // Check current data types
    const jobCardsId = await dbAdapter.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' AND column_name = 'id'
    `);
    
    const prepressJobCardId = await dbAdapter.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prepress_jobs' AND column_name = 'job_card_id'
    `);
    
    console.log('job_cards.id:', jobCardsId.rows[0]);
    console.log('prepress_jobs.job_card_id:', prepressJobCardId.rows[0]);
    
    // Change job_card_id from character varying to uuid
    await dbAdapter.query('ALTER TABLE prepress_jobs ALTER COLUMN job_card_id TYPE uuid USING job_card_id::uuid');
    console.log('✅ Changed prepress_jobs.job_card_id to uuid type');
    
    // Now add the foreign key constraint
    await dbAdapter.query('ALTER TABLE prepress_jobs ADD CONSTRAINT prepress_jobs_job_card_id_fkey FOREIGN KEY (job_card_id) REFERENCES job_cards(id)');
    console.log('✅ Added foreign key constraint');
    
    console.log('🎉 Data type and constraint fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing data type:', err.message);
    process.exit(1);
  }
}

fixPrepressDataTypes();
