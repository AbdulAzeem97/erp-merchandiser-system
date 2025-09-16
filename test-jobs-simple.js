const express = require('express');
const dbAdapter = require('./server/database/adapter.js');

const app = express();
const PORT = 5002;

app.get('/test-jobs', async (req, res) => {
  try {
    console.log('Testing simple jobs query...');
    
    // Test 1: Simple count
    const countResult = await dbAdapter.query('SELECT COUNT(*) as total FROM job_cards');
    console.log('Count result:', countResult.rows[0]);
    
    // Test 2: Simple select
    const jobsResult = await dbAdapter.query('SELECT * FROM job_cards LIMIT 5');
    console.log('Jobs result:', jobsResult.rows.length, 'jobs found');
    
    res.json({
      success: true,
      count: countResult.rows[0].total,
      jobs: jobsResult.rows
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
