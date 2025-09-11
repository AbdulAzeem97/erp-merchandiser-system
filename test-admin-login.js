#!/usr/bin/env node

console.log('👑 Testing Admin Login');
console.log('='.repeat(50));

async function testAdminLogin() {
  const adminCredentials = [
    { email: 'admin@horizonsourcing.com', password: 'password123' },
    { email: 'admin@horizonsourcing.com', password: 'admin123' },
    { email: 'admin@horizonsourcing.com', password: 'admin' },
    { email: 'admin@horizonsourcing.com', password: 'password' }
  ];

  for (const cred of adminCredentials) {
    try {
      console.log(`\n🧪 Testing: ${cred.email} with password: ${cred.password}`);
      
      const response = await fetch('http://192.168.2.56:3001/api/auth/login', {
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
        console.log(`👤 User: ${data.user?.first_name} ${data.user?.last_name}`);
        console.log(`🔑 Token: ${data.token ? 'Present' : 'Missing'}`);
        console.log(`🎭 Role: ${data.user?.role || 'Unknown'}`);
        console.log(`📧 Email: ${data.user?.email || 'Unknown'}`);
        return cred;
      } else {
        const error = await response.json();
        console.log(`❌ Failed: ${error.message || error.error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ No working admin credentials found');
  return null;
}

testAdminLogin();



