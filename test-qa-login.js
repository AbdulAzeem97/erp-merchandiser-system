// Using built-in fetch

async function testQALogin() {
  try {
    console.log('🧪 Testing QA login...');
    
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'qa@horizonsourcing.net.pk',
        password: 'password'
      })
    });
    
    console.log('📊 Login Response Status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ QA Login successful!');
      console.log('👤 User:', loginData.user.firstName, loginData.user.lastName, `(${loginData.user.role})`);
      console.log('🔑 Token preview:', loginData.token.substring(0, 20) + '...');
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ QA Login failed:', errorText);
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(errorText);
        console.log('❌ Error details:', errorData);
      } catch (e) {
        console.log('❌ Raw error response:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testQALogin();
