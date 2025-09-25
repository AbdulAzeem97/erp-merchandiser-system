#!/usr/bin/env node

console.log('🔐 Testing Exact Frontend Request');
console.log('='.repeat(50));

async function testExactFrontendRequest() {
  const email = 'admin@erp.local';
  const password = 'password123';
  
  console.log('📤 Making request exactly like frontend...');
  console.log(`📤 URL: http://localhost:3001/api/auth/login`);
  console.log(`📤 Email: "${email}" (length: ${email.length})`);
  console.log(`📤 Password: "${password}" (length: ${password.length})`);
  
  // Create the exact request body
  const requestBody = JSON.stringify({ email, password });
  console.log(`📤 Request Body: ${requestBody}`);
  console.log(`📤 Request Body Length: ${requestBody.length} bytes`);
  
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:8080',
        'Referer': 'http://localhost:8080/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: requestBody
    });

    console.log(`\n📊 Response Status: ${response.status}`);
    console.log(`📊 Response Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📊 Response Text: ${responseText}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log(`📊 Parsed Response:`, data);
    } catch (parseError) {
      console.log(`❌ Failed to parse JSON: ${parseError.message}`);
      return;
    }
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log(`👤 User: ${data.user?.first_name} ${data.user?.last_name}`);
      console.log(`🎭 Role: ${data.user?.role}`);
    } else {
      console.log(`❌ FAILED: ${data.error || data.message}`);
      if (data.details) {
        console.log(`📋 Validation Details:`, data.details);
      }
    }
    
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

testExactFrontendRequest();



