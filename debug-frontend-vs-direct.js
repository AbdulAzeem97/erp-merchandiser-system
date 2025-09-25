#!/usr/bin/env node

console.log('🔍 Debugging Frontend vs Direct API Request');
console.log('='.repeat(60));

async function debugRequests() {
  const email = 'admin@erp.local';
  const password = 'password123';
  
  console.log('📤 Test Data:');
  console.log(`   Email: "${email}"`);
  console.log(`   Password: "${password}"`);
  console.log(`   Email length: ${email.length}`);
  console.log(`   Password length: ${password.length}`);
  
  // Test 1: Direct API call (like our working test)
  console.log('\n🧪 Test 1: Direct API Call (Working)');
  try {
    const response1 = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log(`   Status: ${response1.status}`);
    const data1 = await response1.json();
    console.log(`   Result: ${response1.ok ? 'SUCCESS' : 'FAILED'}`);
    if (!response1.ok) {
      console.log(`   Error: ${data1.error || data1.message}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 2: Frontend-like request with additional headers
  console.log('\n🧪 Test 2: Frontend-like Request (With Headers)');
  try {
    const response2 = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:8080',
        'Referer': 'http://localhost:8080/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({ email, password })
    });
    
    console.log(`   Status: ${response2.status}`);
    const data2 = await response2.json();
    console.log(`   Result: ${response2.ok ? 'SUCCESS' : 'FAILED'}`);
    if (!response2.ok) {
      console.log(`   Error: ${data2.error || data2.message}`);
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Check if there's a character encoding issue
  console.log('\n🧪 Test 3: Character Encoding Test');
  const emailBytes = new TextEncoder().encode(email);
  const passwordBytes = new TextEncoder().encode(password);
  console.log(`   Email bytes: [${Array.from(emailBytes).join(', ')}]`);
  console.log(`   Password bytes: [${Array.from(passwordBytes).join(', ')}]`);
  
  // Test 4: Try with different password variations
  console.log('\n🧪 Test 4: Password Variations');
  const passwordVariations = [
    'password123',
    'password123 ', // with trailing space
    ' password123', // with leading space
    'Password123',  // different case
    'PASSWORD123'   // all caps
  ];
  
  for (const pwd of passwordVariations) {
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: pwd })
      });
      
      console.log(`   "${pwd}" (${pwd.length} chars): ${response.status} - ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   "${pwd}": ERROR - ${error.message}`);
    }
  }
}

debugRequests();



