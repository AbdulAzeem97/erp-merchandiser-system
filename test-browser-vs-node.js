#!/usr/bin/env node

console.log('🔍 Testing Browser vs Node.js Differences');
console.log('='.repeat(60));

async function testBrowserVsNode() {
  const email = 'admin@horizonsourcing.com';
  const password = 'password123';
  
  // Test 1: Multiple rapid requests (like a browser might do)
  console.log('\n🧪 Test 1: Multiple Rapid Requests');
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch('http://192.168.2.56:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      }).then(async (response) => {
        const data = await response.json();
        return { status: response.status, success: response.ok, data };
      })
    );
  }
  
  const results = await Promise.all(promises);
  results.forEach((result, index) => {
    console.log(`   Request ${index + 1}: ${result.status} - ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (!result.success) {
      console.log(`     Error: ${result.data.error || result.data.message}`);
    }
  });
  
  // Test 2: Request with different user agents
  console.log('\n🧪 Test 2: Different User Agents');
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
  ];
  
  for (const userAgent of userAgents) {
    try {
      const response = await fetch('http://192.168.2.56:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log(`   ${userAgent.substring(0, 50)}...: ${response.status} - ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ${userAgent.substring(0, 50)}...: ERROR - ${error.message}`);
    }
  }
  
  // Test 3: Request with different content types
  console.log('\n🧪 Test 3: Different Content Types');
  const contentTypes = [
    'application/json',
    'application/json; charset=utf-8',
    'application/json;charset=utf-8'
  ];
  
  for (const contentType of contentTypes) {
    try {
      const response = await fetch('http://192.168.2.56:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log(`   ${contentType}: ${response.status} - ${response.ok ? 'SUCCESS' : 'FAILED'}`);
    } catch (error) {
      console.log(`   ${contentType}: ERROR - ${error.message}`);
    }
  }
  
  // Test 4: Check if there's a timing issue
  console.log('\n🧪 Test 4: Timing Tests');
  const delays = [0, 100, 500, 1000];
  
  for (const delay of delays) {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      const startTime = Date.now();
      const response = await fetch('http://192.168.2.56:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      const endTime = Date.now();
      
      const data = await response.json();
      console.log(`   Delay ${delay}ms: ${response.status} - ${response.ok ? 'SUCCESS' : 'FAILED'} (${endTime - startTime}ms)`);
    } catch (error) {
      console.log(`   Delay ${delay}ms: ERROR - ${error.message}`);
    }
  }
}

testBrowserVsNode();



