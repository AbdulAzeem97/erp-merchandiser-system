/**
 * Test the actual API endpoint with a simulated request
 */

import express from 'express';
import smartDashboardController from './server/controllers/smartDashboardController.js';

const app = express();
app.use(express.json());

// Mock request object
const mockReq = {
  params: { jobId: '16' },
  user: { id: 1, role: 'PRODUCTION_MANAGER' }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`\n📤 Response Status: ${code}`);
      console.log('📤 Response Data:', JSON.stringify(data, null, 2));
      return mockRes;
    }
  }),
  json: (data) => {
    console.log('\n📤 Response (200):');
    console.log('📤 Response Data:', JSON.stringify(data, null, 2));
    return mockRes;
  }
};

async function testEndpoint() {
  try {
    console.log('🧪 Testing getJobDetails endpoint directly...\n');
    console.log('📥 Request params:', mockReq.params);
    
    await smartDashboardController.getJobDetails(mockReq, mockRes);
    
    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testEndpoint();

