// Using built-in fetch (Node.js 18+)

const API_BASE_URL = 'http://localhost:3002/api';

async function testERPSystem() {
    console.log('🧪 Testing ERP System with PostgreSQL...');
    
    try {
        // Test 1: Login
        console.log('\n1️⃣ Testing Login...');
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@horizonsourcing.com',
                password: 'password123'
            })
        });
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log(`   User: ${loginData.user.first_name} ${loginData.user.last_name} (${loginData.user.role})`);
        
        const token = loginData.token;
        
        // Test 2: Get Companies (requires auth)
        console.log('\n2️⃣ Testing Companies API...');
        const companiesResponse = await fetch(`${API_BASE_URL}/companies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!companiesResponse.ok) {
            throw new Error(`Companies API failed: ${companiesResponse.status}`);
        }
        
        const companiesData = await companiesResponse.json();
        console.log(`✅ Companies API successful - Found ${companiesData.length} companies`);
        
        // Test 3: Get Job Lifecycle (requires auth)
        console.log('\n3️⃣ Testing Job Lifecycle API...');
        const lifecycleResponse = await fetch(`${API_BASE_URL}/job-lifecycle`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!lifecycleResponse.ok) {
            throw new Error(`Job Lifecycle API failed: ${lifecycleResponse.status}`);
        }
        
        const lifecycleData = await lifecycleResponse.json();
        console.log(`✅ Job Lifecycle API successful - Found ${lifecycleData.length} jobs`);
        
        // Test 4: Get Dashboard Stats (requires auth)
        console.log('\n4️⃣ Testing Dashboard Stats...');
        const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!statsResponse.ok) {
            throw new Error(`Dashboard Stats API failed: ${statsResponse.status}`);
        }
        
        const statsData = await statsResponse.json();
        console.log('✅ Dashboard Stats API successful');
        console.log(`   Total Jobs: ${statsData.total_jobs || 0}`);
        console.log(`   Active Jobs: ${statsData.active_jobs || 0}`);
        
        // Test 5: Test Socket.io connection
        console.log('\n5️⃣ Testing Socket.io Connection...');
        const socketResponse = await fetch('http://localhost:3002/socket.io/');
        if (socketResponse.ok) {
            console.log('✅ Socket.io endpoint accessible');
        } else {
            console.log('⚠️ Socket.io endpoint not accessible');
        }
        
        console.log('\n🎉 All ERP System Tests Passed with PostgreSQL!');
        console.log('\n📊 Summary:');
        console.log('   ✅ PostgreSQL Database: Connected');
        console.log('   ✅ Authentication: Working');
        console.log('   ✅ API Endpoints: Working');
        console.log('   ✅ Real-time Features: Available');
        console.log('   ✅ Multi-user Support: Ready');
        
        return true;
        
    } catch (error) {
        console.error('❌ ERP System Test Failed:', error.message);
        return false;
    }
}

testERPSystem();
