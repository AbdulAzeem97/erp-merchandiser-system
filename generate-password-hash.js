// Quick script to generate password hash
import bcrypt from 'bcryptjs';

const password = 'password';
bcrypt.hash(password, 10).then(hash => {
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nSQL INSERT statement:');
  console.log(`INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")`);
  console.log(`VALUES ('Production', 'User', 'production@horizonsourcing.com', '${hash}', 'PRODUCTION_MANAGER', 'Production', TRUE);`);
});

