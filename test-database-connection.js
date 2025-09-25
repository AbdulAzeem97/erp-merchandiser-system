import dbAdapter from './server/database/adapter.js';

console.log('🔍 Testing database connection...');
console.log('Database type:', dbAdapter.getType());

try {
  // Test a simple query
  const result = await dbAdapter.query('SELECT 1 as test');
  console.log('✅ Database query successful:', result);
  
  // Test users table
  const usersResult = await dbAdapter.query('SELECT COUNT(*) as count FROM users');
  console.log('✅ Users table accessible:', usersResult);
  
  // Test if we can get a specific user
  const adminUser = await dbAdapter.query('SELECT * FROM users WHERE email = $1', ['admin@erp.local']);
  console.log('✅ Admin user query:', adminUser);
  
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
}
