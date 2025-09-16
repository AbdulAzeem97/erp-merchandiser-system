import dbAdapter from './server/database/adapter.js';

async function checkJobCardsTable() {
  try {
    const result = await dbAdapter.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'job_cards'
    `);
    
    console.log('job_cards table exists:', result.rows.length > 0);
    
    if (result.rows.length > 0) {
      // Check the structure
      const structure = await dbAdapter.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'job_cards' 
        ORDER BY ordinal_position
      `);
      
      console.log('job_cards structure:');
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkJobCardsTable();
