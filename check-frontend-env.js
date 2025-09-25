#!/usr/bin/env node

console.log('🔍 Checking Frontend Environment Variables');
console.log('='.repeat(50));

// Check what environment variables are set
console.log('Environment variables:');
console.log('VITE_API_BASE_URL:', process.env.VITE_API_BASE_URL);
console.log('VITE_API_URL:', process.env.VITE_API_URL);

// Test if the frontend can access the API
async function testFrontendAPI() {
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
  
  console.log('\n📊 Using API URLs:');
  console.log('API_BASE_URL:', apiBaseUrl);
  console.log('API_URL:', apiUrl);
  
  try {
    // Test health endpoint
    console.log('\n🧪 Testing health endpoint...');
    const healthResponse = await fetch(`${apiUrl}/health`);
    console.log('Health status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    }
    
    // Test login endpoint
    console.log('\n🧪 Testing login endpoint...');
    const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: 'admin@erp.local', 
        password: 'password123' 
      })
    });
    
    console.log('Login status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFrontendAPI();



