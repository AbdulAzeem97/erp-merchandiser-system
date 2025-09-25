import dbAdapter from './server/database/adapter.js';
import bcrypt from 'bcryptjs';

console.log('🔐 Testing authentication directly...');

try {
  // Get the admin user
  const userResult = await dbAdapter.query(
    'SELECT * FROM users WHERE email = $1 AND is_active = true',
    ['admin@erp.local']
  );
  
  if (userResult.rows.length === 0) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  const user = userResult.rows[0];
  console.log('✅ User found:', user.email);
  console.log('Password hash:', user.password_hash);
  
  // Test password comparison
  const testPasswords = ['admin123', 'admin', 'password', '123456', 'horizonsourcing'];
  
  for (const password of testPasswords) {
    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
    if (isValid) {
      console.log(`🎉 Found correct password: ${password}`);
      break;
    }
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
