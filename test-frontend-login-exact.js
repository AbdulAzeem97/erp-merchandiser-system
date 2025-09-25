#!/usr/bin/env node

console.log('🔐 Testing Frontend Login (Exact Match)');
console.log('='.repeat(50));

async function testFrontendLogin() {
  const credentials = [
    { email: 'admin@erp.local', password: 'password123' },
    { email: 'inventory@horizonsourcing.com', password: 'password123' }
  ];

  for (const cred of credentials) {
    try {
      console.log(`\n🧪 Testing: ${cred.email}`);
      console.log(`📤 Sending request to: http://localhost:3001/api/auth/login`);
      console.log(`📤 Request body:`, JSON.stringify(cred));
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred)
      });

      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log(`📋 Response data:`, data);
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
        console.log(`👤 User: ${data.user?.first_name} ${data.user?.last_name}`);
        console.log(`🎭 Role: ${data.user?.role || 'Unknown'}`);
      } else {
        console.log(`❌ FAILED: ${data.error || data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testFrontendLogin();



