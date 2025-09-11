import bcrypt from 'bcrypt';

// Test the password hash from the database
const storedHash = '$2a$10$V7DFX0KvdxLUW8vFAY13xe7uVzi980FrpBEujs0RLx/Cbw7f5.drq';

console.log('🔐 Testing password verification...');

// Test common passwords
const passwords = ['admin123', 'admin', 'password', '123456', 'horizonsourcing'];

for (const password of passwords) {
  const isValid = await bcrypt.compare(password, storedHash);
  console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
  if (isValid) {
    console.log(`🎉 Found correct password: ${password}`);
    break;
  }
}
