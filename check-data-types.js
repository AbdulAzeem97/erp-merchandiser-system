import dbAdapter from './server/database/adapter.js';

async function checkDataTypes() {
  try {
    const jobCardsId = await dbAdapter.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_cards' AND column_name = 'id'
    `);
    
    const jobLifecycleJobCardId = await dbAdapter.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'job_lifecycle' AND column_name = 'job_card_id'
    `);
    
    console.log('job_cards.id:', jobCardsId.rows[0]);
    console.log('job_lifecycle.job_card_id:', jobLifecycleJobCardId.rows[0]);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkDataTypes();
