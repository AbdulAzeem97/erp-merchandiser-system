import pool from './server/database/sqlite-config.js';

async function checkJobCardsStructure() {
  try {
    const result = await pool.query('PRAGMA table_info(job_cards)');
    console.log('Job Cards Table Structure:');
    if (result.rows && result.rows.length > 0) {
      result.rows.forEach(col => {
        console.log(`${col.name} - ${col.type}`);
      });
    } else {
      console.log('No columns found or result structure:', result);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkJobCardsStructure();
