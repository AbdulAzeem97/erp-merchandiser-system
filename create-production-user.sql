-- Create Production User for Smart Production Dashboard
-- Email: production@horizonsourcing.com
-- Password: password
-- Role: PRODUCTION_MANAGER (Full Access)

-- Password hash for "password" (bcrypt, 10 rounds)
-- Generated: $2a$10$C3Kxr/ERcusVzJAjSKY9o.NxxnnSRS2h5.T6tpEdw9pUnGYYA7Pde

INSERT INTO users ("firstName", "lastName", email, password, role, department, "isActive")
VALUES 
('Production', 'User', 'production@horizonsourcing.com', '$2a$10$C3Kxr/ERcusVzJAjSKY9o.NxxnnSRS2h5.T6tpEdw9pUnGYYA7Pde', 'PRODUCTION_MANAGER', 'Production', TRUE)
ON CONFLICT (email) DO UPDATE SET 
  role = 'PRODUCTION_MANAGER',
  password = '$2a$10$C3Kxr/ERcusVzJAjSKY9o.NxxnnSRS2h5.T6tpEdw9pUnGYYA7Pde',
  "isActive" = TRUE;

-- Verify user was created
SELECT id, email, role, department, "isActive" 
FROM users 
WHERE email = 'production@horizonsourcing.com';

