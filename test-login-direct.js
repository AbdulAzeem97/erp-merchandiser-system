#!/usr/bin/env node

console.log('🔐 Testing Login API Directly');
console.log('='.repeat(50));

async function testLogin() {
  const testCredentials = [
    { email: 'inventory@horizonsourcing.com', password: 'password123' },
    { email: 'emma.wilson@horizonsourcing.com', password: 'password123' },
    { email: 'sarah.johnson@horizonsourcing.com', password: 'password123' },
    { email: 'admin@erp.local', password: 'password123' }
  ];

  for (const cred of testCredentials) {
    try {
      console.log(`\n🧪 Testing: ${cred.email}`);
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });

      console.log(`📊 Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log(`👤 User: ${data.user?.name || 'Unknown'}`);
        console.log(`🔑 Token: ${data.token ? 'Present' : 'Missing'}`);
        console.log(`🎭 Role: ${data.user?.role || 'Unknown'}`);
        return cred;
      } else {
        const error = await response.json();
        console.log(`❌ Failed: ${error.message || error.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ No working credentials found');
  return null;
}

testLogin();



