#!/usr/bin/env node

console.log('🔐 Testing Login with Validation Headers');
console.log('='.repeat(50));

async function testWithValidation() {
  const credentials = [
    { email: 'admin@horizonsourcing.com', password: 'password123' },
    { email: 'admin@horizonsourcing.com', password: 'password' }, // 8 chars
    { email: 'admin@horizonsourcing.com', password: 'pass' }, // 4 chars - should fail validation
  ];

  for (const cred of credentials) {
    try {
      console.log(`\n🧪 Testing: ${cred.email} with password length: ${cred.password.length}`);
      
      const response = await fetch('http://192.168.2.56:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'http://192.168.2.56:8080',
          'Referer': 'http://192.168.2.56:8080/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify(cred)
      });

      console.log(`📊 Response status: ${response.status}`);
      
      const data = await response.json();
      console.log(`📋 Response data:`, data);
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
      } else {
        console.log(`❌ FAILED: ${data.error || data.message}`);
        if (data.details) {
          console.log(`📋 Validation details:`, data.details);
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testWithValidation();



