#!/usr/bin/env node

console.log('🔍 Testing Exact Frontend Mimic');
console.log('='.repeat(50));

// This mimics exactly what the frontend authAPI.login function does
async function testExactFrontendMimic() {
  const email = 'admin@erp.local';
  const password = 'password123';
  
  console.log('🔐 Starting login process for:', email);
  
  try {
    // This is exactly what the frontend does
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log(`📊 Login response status: ${response.status}`);
    
    const data = await response.json();
    console.log('📋 Login response received:', data);
    
    if (!response.ok) {
      // Handle login failure
      if (response.status === 401) {
        console.log('❌ 401 Unauthorized - Invalid email or password');
        return;
      } else if (response.status === 500) {
        console.log('❌ 500 Server Error');
        return;
      } else {
        console.log(`❌ Other error: ${data.error || data.message || 'Login failed'}`);
        return;
      }
    }
    
    // Handle successful login
    const token = data.token || data.tokens?.access_token || data.tokens?.token;
    
    if (token) {
      console.log('✅ Login successful, token found');
      console.log('👤 User:', data.user?.first_name, data.user?.last_name);
      console.log('🎭 Role:', data.user?.role);
    } else {
      console.log('❌ No token found in response');
    }
    
  } catch (error) {
    console.log('❌ Login error:', error.message);
    
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log('❌ Network error: Unable to connect to server');
    } else {
      console.log('❌ Other error:', error.message);
    }
  }
}

testExactFrontendMimic();



