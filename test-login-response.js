#!/usr/bin/env node

console.log('🔍 Testing Login Response Structure');
console.log('='.repeat(45));

async function testLoginResponse() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@erp.local',
        password: 'password123'
      })
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📝 Raw Response:`, responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Parsed Response Structure:');
        console.log(JSON.stringify(data, null, 2));
        
        // Check for expected properties
        console.log('\n🔍 Property Analysis:');
        console.log(`   - data: ${typeof data}`);
        console.log(`   - data.token: ${data.token ? 'EXISTS' : 'MISSING'}`);
        console.log(`   - data.user: ${data.user ? 'EXISTS' : 'MISSING'}`);
        console.log(`   - data.tokens: ${data.tokens ? 'EXISTS' : 'MISSING'}`);
        
        if (data.user) {
          console.log(`   - data.user.id: ${data.user.id ? 'EXISTS' : 'MISSING'}`);
          console.log(`   - data.user.email: ${data.user.email ? 'EXISTS' : 'MISSING'}`);
          console.log(`   - data.user.role: ${data.user.role ? 'EXISTS' : 'MISSING'}`);
        }
        
      } catch (parseError) {
        console.log('❌ JSON Parse Error:', parseError.message);
      }
    } else {
      console.log('❌ Login Failed');
    }
    
  } catch (error) {
    console.log('❌ Request Error:', error.message);
  }
}

testLoginResponse();
